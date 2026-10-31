import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import {
  dsCommand,
  goldenCommand,
  runCommand,
  showCommand,
  UsageError,
  validateCommand,
  wireframesCommand,
} from './cli';
import { readArtifact } from './core/artifacts';
import type { Config } from './core/env';
import type { Llm } from './core/llm';
import { readState, type Run, runPath } from './core/run';

const runsDir = mkdtempSync(path.join(tmpdir(), 'weave-cli-'));
afterAll(() => rmSync(runsDir, { recursive: true, force: true }));
const fixture = (name: string) =>
  fileURLToPath(new URL(`./ds/__fixtures__/${name}`, import.meta.url));
const printFile = (file: string) => ({
  file: 'node',
  args: [
    '-e',
    'process.stdout.write(require("fs").readFileSync(process.argv[1], "utf8"))',
    file,
  ],
});

const config: Config = {
  MODEL_API_KEY: 'test-key',
  LLM_BASE_URL: 'https://api.meta.ai/v1',
  LLM_MODEL: 'muse-spark-1.3',
  LLM_MODEL_STRONG: 'muse-wonder-1.0',
  LLM_MODEL_VISION: 'muse-spark-1.3',
  LLM_REPLAY: true,
  LLM_BACKEND: 'meta',
  BASETEN_BASE_URL: 'https://inference.baseten.co/v1',
};
const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(
      new URL(`./stages/flows/__fixtures__/${name}`, import.meta.url),
      'utf8',
    ),
  );
const byScheme: Record<string, unknown> = {
  Scope: load('reading-list.scope.json'),
  Flows: load('reading-list.flows.json'),
  Review: { blockers: [] },
};
/** The fixtures for the stages, an empty review for the reviewers; 10 tokens in, 5 out, $0.001 per call. */
const llm: Llm = {
  async generateStructured(input) {
    const data = byScheme[input.schemaName];
    if (!data) throw new Error(`unexpected schema ${input.schemaName}`);
    return {
      data: data as never,
      raw: JSON.stringify(data),
      usage: { input: 10, cachedInput: 0, output: 5 },
      costUsd: 0.001,
      replayed: false,
      backend: 'meta',
      model: 'muse-spark-1.3',
      durationMs: 1,
    };
  },
};
const lines: string[] = [];
const deps = { runsDir, config, llm, out: (line: string) => lines.push(line) };
const idea = 'fixtures/ideas/freelancer-workspace.md';

describe('weave run', () => {
  let run: Run;

  it('creates the run folder and runs the scope stage', async () => {
    run = await runCommand({ idea, to: 'scope' }, deps);
    expect(run.id).toMatch(/^\d{8}-\d{4}-freelancer-workspace$/);
    expect(existsSync(runPath(run, 'input', 'idea.md'))).toBe(true);
    expect(readArtifact(run, 'scope').meta).toMatchObject({
      version: 1,
      model: 'muse-spark-1.3',
      stage: 'scope',
      rounds: 2,
    });
    expect(readState(run).stages.scope).toMatchObject({
      status: 'done',
      version: 1,
    });
    expect(lines).toEqual([
      `run ${run.id} (${run.dir})`,
      'scope: running',
      'scope: done v1, 2 rounds',
    ]);
  });

  it('skips a stage that is done and not stale on a rerun', async () => {
    lines.length = 0;
    await runCommand({ idea, run: run.id, to: 'scope' }, deps);
    expect(readArtifact(run, 'scope').meta.version).toBe(1);
    expect(lines[1]).toBe('scope: up to date (v1)');
  });

  it('reruns from the stage named by --from', async () => {
    await runCommand({ idea, run: run.id, from: 'scope', to: 'scope' }, deps);
    expect(readArtifact(run, 'scope').meta.version).toBe(2);
  });

  it('rejects an unknown stage before touching the disk', async () => {
    await expect(
      runCommand({ idea, to: 'nowhere' }, deps),
    ).rejects.toBeInstanceOf(UsageError);
    await expect(runCommand({ idea, to: 'nowhere' }, deps)).rejects.toThrow(
      /Known stages: scope, flows/,
    );
  });

  it('show prints the stage table and the totals', () => {
    const text = showCommand(run.id, deps);
    expect(text).toContain(`run ${run.id}`);
    expect(text).toMatch(/stage\s+status\s+version\s+rounds\s+known\s+updated/);
    expect(text).toMatch(/scope\s+done\s+2/);
    // Two scope runs (the first and the --from rerun), each one generation and two reviews.
    expect(text).toContain('6 calls, 60 tokens in, 30 out, $0.0060');
  });

  it('golden copies the accepted artifacts and their markdown, and prints the stage totals', () => {
    lines.length = 0;
    // Writes into the real fixtures/golden; a throwaway idea name, removed at the end.
    const ideaName = `tmp-test-${process.pid}`;
    const dest = path.join('fixtures', 'golden', ideaName);
    try {
      const printed = goldenCommand(run.id, ideaName, 'scope', deps);
      expect(existsSync(path.join(dest, '01-scope.json'))).toBe(true);
      expect(existsSync(path.join(dest, '01-scope.md'))).toBe(true);
      expect(printed).toEqual([
        'scope: 2 rounds, 0 known issues, 3 calls, 30 tokens in, 15 out, $0.0030',
      ]);
      expect(lines[0]).toContain(
        `golden ${ideaName}: 01-scope.json, 01-scope.md ->`,
      );
      expect(() => goldenCommand(run.id, ideaName, 'flows', deps)).toThrow(
        /no flows artifact/,
      );
      expect(() => goldenCommand(run.id, ideaName, 'nope', deps)).toThrow(
        UsageError,
      );
    } finally {
      rmSync(dest, { recursive: true, force: true });
    }
  });

  it('validate reruns the rules on the stored scope, reports a missing flows artifact and rejects unknown stages', () => {
    lines.length = 0;
    expect(validateCommand(run.id, undefined, deps)).toEqual([]);
    expect(lines).toEqual([
      'scope: 0 mandatory, 0 warnings',
      'flows-catalog: no artifact to validate',
      'flows-expand: no artifact to validate',
      'flows: no artifact to validate',
      'brief: no artifact to validate',
      'theme: no validators registered',
      'design: no validators registered',
    ]);
    expect(() => validateCommand(run.id, 'nowhere', deps)).toThrow(UsageError);
  });
});

describe('weave ds', () => {
  it('prints the counts, the summary size and the project settings', async () => {
    lines.length = 0;
    // Fake tools print the fixtures; the cache lives in the temp folder.
    const printed = await dsCommand({
      templateDir: 'template',
      cacheDir: path.join(runsDir, 'cache'),
      exporter: printFile(fixture('export.json')),
      measurer: printFile(fixture('boxes.json')),
      out: deps.out,
    });
    expect(printed).toEqual(lines);
    expect(lines[0]).toMatch(/^\d+ components, \d+ with looks, \d+ tokens$/);
    expect(lines[1]).toMatch(/^prose \d+ bytes$/);
    expect(lines[2]).toMatch(/^box: \d+ components measured$/);
    expect(lines[3]).toMatch(/^project: focus ring halo, .* entity sets$/);
  });
});

describe('weave wireframes', () => {
  it('writes the skeleton and the wireframes for a screens file under runs/wireframes/<name>/', async () => {
    lines.length = 0;
    const screens = fileURLToPath(
      new URL(
        './stages/design/__fixtures__/reading-list.screens.json',
        import.meta.url,
      ),
    );
    const printed = await wireframesCommand(screens, undefined, {
      templateDir: 'template',
      cacheDir: path.join(runsDir, 'cache'),
      exporter: printFile(fixture('export.json')),
      measurer: printFile(fixture('boxes.json')),
      runsDir,
      out: deps.out,
    });
    const dest = path.join(runsDir, 'wireframes', 'reading-list.screens');
    expect(printed).toEqual([
      expect.stringMatching(/^7 screens, \d+ rectangles$/),
      path.join(dest, '02-skeleton.json'),
      path.join(dest, '02-wireframes.html'),
    ]);
    const solved = JSON.parse(
      readFileSync(path.join(dest, '02-skeleton.json'), 'utf8'),
    ) as { screens: unknown[] };
    expect(solved.screens).toHaveLength(7);
    expect(
      readFileSync(path.join(dest, '02-wireframes.html'), 'utf8'),
    ).toContain('<svg');
  });
});
