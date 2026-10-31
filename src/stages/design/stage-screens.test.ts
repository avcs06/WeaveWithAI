import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { readArtifact, writeArtifact } from '../../core/artifacts';
import type { Config } from '../../core/env';
import { readReport } from '../../core/issues';
import type { GenerateInput, Llm } from '../../core/llm';
import { createRun, readState, runPath } from '../../core/run';
import { Flows, Scope } from '../flows/schema';
import type { StageContext } from '../index';
import {
  builds,
  designs,
  frames,
  ia,
  inventory,
  screens as fixture,
} from './__fixtures__/widgets';
import type { WidgetScreens } from './assemble';
import { Brief } from './schema';
import type { ThemeCall } from './schema-theme';
import type { Build } from './schema-widgets';
import { runDesign } from './stage-screens';
import { buildTheme } from './theme';

const root = mkdtempSync(path.join(tmpdir(), 'weave-design-screens-'));
const idea = path.join(root, 'reading-list.md');
writeFileSync(idea, 'A reading list for one reader.\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const scope = Scope.parse(
  read('../flows/__fixtures__/reading-list.scope.json'),
);
const flows = Flows.parse(
  read('../flows/__fixtures__/reading-list.flows.json'),
);
const brief = Brief.parse(read('./__fixtures__/reading-list.brief.json'));
const theme = buildTheme(
  brief,
  read('./__fixtures__/reading-list.theme.json') as ThemeCall,
);
const config = { MODEL_API_KEY: 'k', LLM_BACKEND: 'meta' } as Config;

/** Answers by schema from the derived widget fixtures; `first` replaces a widget's build in its call's first answer. */
function fakeLlm(first: Record<string, Build> = {}) {
  const inputs: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      inputs.push(input as GenerateInput<unknown>);
      const fix = input.stage.endsWith('-fix');
      const ids = input.stage
        .replace(/^design-(widgets|frame|component)-/, '')
        .replace(/-fix$/, '')
        .split('-');
      const answers: Record<string, () => unknown> = {
        Ia: () => ia,
        ComponentDesign: () => designs.get(ids[0] ?? ''),
        WidgetBatch: () => ({
          widgets: ids.map(
            (id) => (!fix && first[id]) || builds.find((b) => b.widget === id),
          ),
        }),
        FrameBuild: () => frames.find((f) => f.screen === ids[0]),
      };
      const data = answers[input.schemaName]?.() ?? { blockers: [] };
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
  return { llm, inputs };
}

/** A run with the scope, flows, brief and theme the design stage reads. */
function prepared(id: string) {
  const run = createRun({ idea, runsDir: root, id });
  const meta = { model: null, rounds: 1 };
  writeArtifact(run, 'scope', scope, { ...meta, stage: 'scope', inputs: [] });
  writeArtifact(run, 'flows', flows, {
    ...meta,
    stage: 'flows',
    inputs: ['scope'],
  });
  writeArtifact(run, 'brief', brief, {
    ...meta,
    stage: 'brief',
    inputs: ['scope'],
  });
  writeArtifact(run, 'theme', theme, {
    ...meta,
    stage: 'theme',
    inputs: ['brief'],
  });
  return run;
}
const contextFor = (run: StageContext['run'], llm: Llm): StageContext => ({
  run,
  config,
  llm,
  interactive: false,
  backend: 'meta',
});
const writers = (inputs: GenerateInput<unknown>[]) =>
  inputs.filter((i) => !i.stage.includes('-review-')).map((i) => i.stage);

describe('runDesign', () => {
  it('runs the IA, a call per component, per two widgets and per used shell, and writes the screens, skeleton, wireframes, markdown and gap report', async () => {
    const run = prepared('clean');
    const { llm, inputs } = fakeLlm();
    const log = path.join(root, 'clean-gaps.jsonl');
    await runDesign(contextFor(run, llm), inventory, log);

    const pairs = [
      'W01-W02',
      'W03-W04',
      'W05-W06',
      'W07-W08',
      'W09-W10',
      'W11-W12',
      'W13-W14',
    ];
    expect(writers(inputs)).toEqual([
      'design-ia',
      'design-component-TitleCover',
      ...pairs.map((pair) => `design-widgets-${pair}`),
      'design-frame-SH1',
      'design-frame-SH2',
    ]);
    const settings = (stage: string) => inputs.find((i) => i.stage === stage);
    expect(settings('design-ia')).toMatchObject({
      reasoningEffort: 'high',
      maxTokens: 65_536,
    });
    expect(settings('design-component-TitleCover')).toMatchObject({
      reasoningEffort: 'high',
      maxTokens: 16_384,
    });
    expect(settings('design-widgets-W05-W06')).toMatchObject({
      reasoningEffort: 'medium',
      maxTokens: 16_384,
    });
    // The IA has both reviewers; the calls that build on it have the output reviewer alone.
    const reviews = inputs
      .map((i) => i.stage)
      .filter((stage) => stage.includes('-review-'));
    expect(reviews.filter((stage) => stage.startsWith('design-ia-'))).toEqual([
      'design-ia-review-peer',
      'design-ia-review-output',
    ]);
    expect(
      reviews.filter(
        (stage) =>
          !stage.startsWith('design-ia-') && !stage.endsWith('-review-output'),
      ),
    ).toEqual([]);

    const screens = readArtifact<WidgetScreens>(run, 'screens');
    expect(screens.meta.inputs).toMatchObject({
      scope: {},
      flows: {},
      brief: {},
      theme: {},
    });
    expect(screens.data.nodes).toHaveLength(fixture.nodes.length);
    expect(screens.data.screens.map((s) => [s.id, s.shell])).toEqual(
      fixture.screens.map((s) => [s.id, s.shell]),
    );
    expect(screens.data.copy).toEqual(ia.copy);
    expect(screens.data.widgets.find((w) => w.id === 'W01')).toMatchObject({
      kind: 'hero',
      edge: 'band',
    });
    for (const file of [
      '02-skeleton.json',
      '02-wireframes.html',
      '02-design.md',
    ])
      expect(existsSync(runPath(run, file)), file).toBe(true);
    const gaps = JSON.parse(
      readFileSync(runPath(run, '02-ds-gaps.json'), 'utf8'),
    ) as { name: string; usedOn: string[] }[];
    expect(gaps).toMatchObject([{ name: 'TitleCover', usedOn: ['S06'] }]);
    expect(readFileSync(log, 'utf8').trim().split('\n')).toHaveLength(1);
    expect(readReport(run, 'design')?.rounds.map((r) => r.round)).toEqual([1]);
    expect(readState(run).stages.design).toMatchObject({
      status: 'done',
      known: 0,
    });
  });

  it('sends an issue found on the assembled page back to the call that built its widget, once, as a named fix', async () => {
    const run = prepared('routed');
    // The toolbar spaces its items 32 apart: fine alone, but wider than the page spaces its widgets (LAYOUT-001).
    const loose = structuredClone(builds.find((b) => b.widget === 'W06')!);
    loose.layout.gap = '8';
    const { llm, inputs } = fakeLlm({ W06: loose });
    await runDesign(
      contextFor(run, llm),
      inventory,
      path.join(root, 'routed-gaps.jsonl'),
    );

    expect(writers(inputs).filter((stage) => stage.endsWith('-fix'))).toEqual([
      'design-widgets-W05-W06-fix',
    ]);
    const fix = inputs.find((i) => i.stage === 'design-widgets-W05-W06-fix');
    expect(fix?.messages.at(-1)?.content).toContain('LAYOUT-001 at W06');
    expect(fix?.messages.at(-1)?.content).toContain('W06 (as S04.sec2)');
    expect(fix?.messages.at(-2)?.role).toBe('assistant');
    expect(
      writers(inputs).filter((stage) => stage === 'design-ia'),
    ).toHaveLength(1);
    const report = readReport(run, 'design');
    expect(report?.rounds[0]?.issues.map((i) => i.rule)).toEqual([
      'LAYOUT-001',
    ]);
    expect(report?.rounds[1]?.issues).toEqual([]);
    expect(readState(run).stages['design-widgets-W05-W06-fix']).toMatchObject({
      status: 'done',
    });
    expect(readState(run).stages.design).toMatchObject({ known: 0 });
  });
});
