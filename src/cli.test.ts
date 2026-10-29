import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { runCommand, showCommand, UsageError, validateCommand } from './cli';
import { readArtifact } from './core/artifacts';
import type { Config } from './core/env';
import type { Llm } from './core/llm';
import { readState, type Run, runPath } from './core/run';

const runsDir = mkdtempSync(path.join(tmpdir(), 'weave-cli-'));
afterAll(() => rmSync(runsDir, { recursive: true, force: true }));

const config: Config = {
  MODEL_API_KEY: 'test-key',
  LLM_BASE_URL: 'https://api.meta.ai/v1',
  LLM_MODEL: 'muse-spark-1.3',
  LLM_MODEL_STRONG: 'muse-wonder-1.0',
  LLM_MODEL_VISION: 'muse-spark-1.3',
  LLM_REPLAY: true,
};
const llm: Llm = {
  generateStructured() {
    throw new Error('the stub stage must not call the model');
  },
};
const lines: string[] = [];
const deps = { runsDir, config, llm, out: (line: string) => lines.push(line) };
const idea = 'fixtures/ideas/project-tracker.md';

describe('weave run', () => {
  let run: Run;

  it('creates the run folder and runs the stub scope stage', async () => {
    run = await runCommand({ idea, to: 'scope' }, deps);
    expect(run.id).toMatch(/^\d{8}-\d{4}-project-tracker$/);
    expect(existsSync(runPath(run, 'input', 'idea.md'))).toBe(true);
    expect(readArtifact(run, 'scope').meta).toMatchObject({ version: 1, model: null, stage: 'scope' });
    expect(readState(run).stages.scope).toMatchObject({ status: 'done', version: 1 });
    expect(lines).toEqual([`run ${run.id} (${run.dir})`, 'scope: running', 'scope: done v1']);
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
    await expect(runCommand({ idea, to: 'nowhere' }, deps)).rejects.toBeInstanceOf(UsageError);
    await expect(runCommand({ idea, to: 'nowhere' }, deps)).rejects.toThrow(/Known stages: scope, flows/);
  });

  it('show prints the stage table and the totals', () => {
    const text = showCommand(run.id, deps);
    expect(text).toContain(`run ${run.id}`);
    expect(text).toMatch(/stage\s+status\s+version\s+rounds\s+updated/);
    expect(text).toMatch(/scope\s+done\s+2/);
    expect(text).toContain('0 calls, 0 tokens in, 0 out, $0.0000');
  });

  it('validate reports stages without validators and rejects unknown ones', () => {
    lines.length = 0;
    expect(validateCommand(run.id, undefined, deps)).toEqual([]);
    expect(lines).toEqual(['scope: no validators registered']);
    expect(() => validateCommand(run.id, 'nowhere', deps)).toThrow(UsageError);
  });
});
