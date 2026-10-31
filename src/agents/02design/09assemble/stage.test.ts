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
import { readArtifact, writeArtifact } from '../../../core/artifacts';
import type { Config } from '../../../core/env';
import { readReport } from '../../../core/issues';
import type { GenerateInput, Llm } from '../../../core/llm';
import { createRun, readState, runPath } from '../../../core/run';
import type { StageContext } from '../../stages';
import {
  builds,
  catalogCall,
  designs,
  flows,
  frames,
  inventory,
  layouts,
  planCall,
  scope,
  screens as fixture,
  brief,
  theme,
} from '../__fixtures__/chain';
import type { Processed as Plan } from '../03architect/process';
import { runArchitect } from '../03architect/stage';
import { runCatalog } from '../04catalog/stage';
import { groupsOf, runScreen } from '../05screen/stage';
import { runInvent } from '../06invent/stage';
import type { Build } from '../07draw/schema';
import { runDraw } from '../07draw/stage';
import { runFrame } from '../08frame/stage';
import type { WidgetScreens } from './assemble';
import { runAssemble } from './stage';

const root = mkdtempSync(path.join(tmpdir(), 'weave-design-screens-'));
const idea = path.join(root, 'reading-list.md');
writeFileSync(idea, 'A reading list for one reader.\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const config = { MODEL_API_KEY: 'k', LLM_BACKEND: 'meta' } as Config;

/** Answers by schema from the chain fixture; `first` replaces a widget's build in its call's first answer. */
function fakeLlm(first: Record<string, Build> = {}) {
  const inputs: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      inputs.push(input as GenerateInput<unknown>);
      const ids = input.stage
        .replace(/^design-(screen|draw|frame|invent)-/, '')
        .replace(/-fix$/, '')
        .split('-');
      const drawn = (fix: boolean) => (!fix && first[ids[0] ?? '']) || builds.find((b) => b.widget === ids[0]);
      const answers: Record<string, () => unknown> = {
        Plan: () => planCall,
        Catalog: () => catalogCall,
        ScreenLayouts: () => {
          const group = groupsOf({ ...planCall, navigation: [] } as unknown as Plan).get(ids[0] ?? '') ?? [];
          return { screens: layouts.filter((l) => group.includes(l.screen)) };
        },
        ComponentDesign: () => designs.get(ids[0] ?? ''),
        Build: () => drawn(false),
        BuildPatch: () => ({ widget: null, edge: null, layout: drawn(true)?.layout, nodes: { upsert: drawn(true)?.nodes ?? [], remove: [] } }),
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

/** A run with the scope, flows, brief and theme the design stages read. */
function prepared(id: string) {
  const run = createRun({ idea, runsDir: root, id });
  const meta = { model: null, rounds: 1 };
  writeArtifact(run, 'flows-scope', scope, {
    ...meta,
    stage: 'flows-scope',
    inputs: [],
  });
  writeArtifact(run, 'flows-reconcile', flows, {
    ...meta,
    stage: 'flows-reconcile',
    inputs: ['flows-scope'],
  });
  writeArtifact(run, 'design-brief', brief, {
    ...meta,
    stage: 'design-brief',
    inputs: ['flows-scope'],
  });
  writeArtifact(run, 'design-theme', theme, {
    ...meta,
    stage: 'design-theme',
    inputs: ['design-brief'],
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

/** The design stages after the theme, in pipeline order. */
async function design(ctx: StageContext, log: string) {
  await runArchitect(ctx, inventory);
  await runCatalog(ctx, inventory);
  await runScreen(ctx, inventory);
  await runInvent(ctx, inventory);
  await runDraw(ctx, inventory);
  await runFrame(ctx, inventory);
  await runAssemble(ctx, inventory, log);
}

describe('the design stages after the theme', () => {
  it('plan, define, lay out, invent, draw each widget in its own call and frame each used shell, then assemble the screens, skeleton, wireframes, markdown and gap report', async () => {
    const run = prepared('clean');
    const { llm, inputs } = fakeLlm();
    const log = path.join(root, 'clean-gaps.jsonl');
    await design(contextFor(run, llm), log);

    expect(writers(inputs)).toEqual([
      'design-architect',
      'design-catalog',
      ...['S01', 'S02', 'S03', 'S04', 'S06'].map((page) => `design-screen-${page}`),
      'design-invent-TitleCover',
      ...['W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08', 'W09', 'W10', 'W11'].map((key) => `design-draw-${key}`),
      'design-frame-SH1',
      'design-frame-SH2',
    ]);
    const settings = (stage: string) => inputs.find((i) => i.stage === stage);
    expect(settings('design-architect')).toMatchObject({ reasoningEffort: 'high', maxTokens: 65_536, temperature: 0.7 });
    // The catalog and screen calls take the default 0.2.
    expect(settings('design-catalog')).toMatchObject({ reasoningEffort: 'medium', maxTokens: 65_536, temperature: undefined });
    expect(settings('design-screen-S04')).toMatchObject({ reasoningEffort: 'medium', maxTokens: 16_384, temperature: undefined });
    expect(settings('design-invent-TitleCover')).toMatchObject({ reasoningEffort: 'medium', maxTokens: 16_384, temperature: 0.7 });
    expect(settings('design-draw-W06')).toMatchObject({ reasoningEffort: 'medium', maxTokens: 32_768 });
    // The architect and invent calls have both reviewers; the rest the output reviewer alone.
    const peers = inputs.map((i) => i.stage).filter((stage) => stage.endsWith('-review-peer'));
    expect(peers).toEqual(['design-architect-review-peer', 'design-invent-TitleCover-review-peer']);

    const screens = readArtifact<WidgetScreens>(run, 'design-assemble');
    expect(Object.keys(screens.meta.inputs).sort()).toEqual(
      [
        'design-architect',
        'design-catalog',
        'design-screen',
        'design-invent',
        'design-draw',
        'design-frame',
        'design-brief',
        'design-theme',
        'flows-scope',
        'flows-reconcile',
      ].sort(),
    );
    expect(screens.data.nodes).toHaveLength(fixture.nodes.length);
    expect(screens.data.screens.map((s) => [s.id, s.shell])).toEqual(fixture.screens.map((s) => [s.id, s.shell]));
    expect(screens.data.widgets.find((w) => w.id === 'W01')).toMatchObject({ kind: 'hero', edge: 'band' });
    for (const file of ['02-design/09-skeleton.json', '02-design/09-wireframes.html', '02-design/09-assemble.md'])
      expect(existsSync(runPath(run, file)), file).toBe(true);
    const gaps = JSON.parse(readFileSync(runPath(run, '02-design/09-ds-gaps.json'), 'utf8')) as {
      name: string;
      usedOn: string[];
    }[];
    expect(gaps).toMatchObject([{ name: 'TitleCover', usedOn: ['S06'] }]);
    expect(readFileSync(log, 'utf8').trim().split('\n')).toHaveLength(1);
    expect(readReport(run, 'design-assemble')?.rounds.map((r) => r.round)).toEqual([1]);
    const { stages } = readState(run);
    for (const stage of [
      'design-architect',
      'design-catalog',
      'design-screen',
      'design-invent',
      'design-draw',
      'design-frame',
      'design-assemble',
    ])
      expect(stages[stage], stage).toMatchObject({ status: 'done' });
    expect(stages['design-assemble']).toMatchObject({ known: 0 });
  });

  it('run screen, invent, draw and frame side by side, as the CLI starts them, with every stage and call recorded', async () => {
    const run = prepared('side-by-side');
    const { llm } = fakeLlm();
    const ctx = contextFor(run, llm);
    await runArchitect(ctx, inventory);
    await runCatalog(ctx, inventory);
    await Promise.all([runScreen(ctx, inventory), runInvent(ctx, inventory), runDraw(ctx, inventory), runFrame(ctx, inventory)]);
    await runAssemble(ctx, inventory, path.join(root, 'side-gaps.jsonl'));
    const { stages } = readState(run);
    for (const stage of ['design-screen', 'design-invent', 'design-draw', 'design-frame', 'design-assemble'])
      expect(stages[stage], stage).toMatchObject({ status: 'done' });
    for (const call of ['design-screen-S04', 'design-invent-TitleCover', 'design-draw-W08', 'design-frame-SH2'])
      expect(stages[call], call).toMatchObject({ status: 'done' });
    expect(stages['design-assemble']).toMatchObject({ known: 0 });
    expect(readArtifact<WidgetScreens>(run, 'design-assemble').data.nodes).toHaveLength(fixture.nodes.length);
  });

  it('send an issue found on the assembled page back to the call that drew its widget, once, as a named patch fix', async () => {
    const run = prepared('routed');
    // The hero pads 16: fine alone, but on the landing page its title sits under the overlay header (LAYOUT-070).
    const tight = structuredClone(builds.find((b) => b.widget === 'W01')!);
    tight.layout.padding = '4';
    const { llm, inputs } = fakeLlm({ W01: tight });
    await design(contextFor(run, llm), path.join(root, 'routed-gaps.jsonl'));

    expect(writers(inputs).filter((stage) => stage.endsWith('-fix'))).toEqual(['design-draw-W01-fix']);
    const fix = inputs.find((i) => i.stage === 'design-draw-W01-fix');
    expect(fix?.schemaName).toBe('BuildPatch');
    expect(fix?.messages.at(-1)?.content).toContain('LAYOUT-070 at W01');
    expect(fix?.messages.at(-1)?.content).toContain('W01 (as S01.sec1)');
    expect(fix?.messages.at(-2)?.role).toBe('assistant');
    expect(writers(inputs).filter((stage) => stage === 'design-architect')).toHaveLength(1);
    const report = readReport(run, 'design-assemble');
    const mandatory = (round: number) =>
      [...new Set(report?.rounds[round]?.issues.filter((i) => i.severity === 'mandatory').map((i) => i.rule))];
    expect(mandatory(0)).toEqual(['LAYOUT-070']);
    expect(report?.rounds[1]?.issues).toEqual([]);
    // The fix is the draw stage's own: a new version of its artifact, which the assembly reads.
    expect(readArtifact(run, 'design-draw').meta.version).toBe(2);
    const { stages } = readState(run);
    expect(stages['design-draw-W01-fix']).toMatchObject({ status: 'done' });
    expect(stages['design-assemble']).toMatchObject({ known: 0 });
  });
});
