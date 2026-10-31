import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { readArtifact, writeArtifact } from '../../../core/artifacts';
import type { Config } from '../../../core/env';
import type { GenerateInput, Llm } from '../../../core/llm';
import { createRun, readState } from '../../../core/run';
import type { Inventory } from '../../../ds/inventory';
import { Scope } from '../../01flows/01scope/schema';
import { Flows } from '../../01flows/schema';
import type { StageContext } from '../../stages';
import { Brief } from '../01brief/schema';
import { briefStage, runBrief } from '../01brief/stage';
import { runTheme } from './stage';
import { buildTheme, type Theme } from './build';

const root = mkdtempSync(path.join(tmpdir(), 'weave-design-stage-'));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '<!-- test -->\n\nA reading list for one reader.\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const scope = Scope.parse(read('../../01flows/__fixtures__/reading-list.scope.json'));
const flows = Flows.parse(read('../../01flows/__fixtures__/reading-list.flows.json'));
const inventory = read('../../../ds/__fixtures__/inventory.json') as Inventory;
const brief = Brief.parse(read('../__fixtures__/reading-list.brief.json'));
const { colors, layouts, defaults } = read(
  '../__fixtures__/reading-list.theme.json',
) as Theme;
const call = { colors, layouts, defaults };

const config = { MODEL_API_KEY: 'k', LLM_BACKEND: 'meta' } as Config;

/** Answers by schema: the reading-list brief and theme call, and nothing for the reviewers to block. */
function fakeLlm() {
  const inputs: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      inputs.push(input as GenerateInput<unknown>);
      const answers: Record<string, unknown> = {
        Brief: brief,
        Theme: call,
        Review: { blockers: [] },
      };
      const data = answers[input.schemaName];
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
  return { llm, inputs };
}

/** A run with the scope and flows the design stages read. */
function runWithFlows(id: string) {
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
  return run;
}

describe('the brief and theme stages', () => {
  it('write the brief and the built theme, each from its own call at its own model, level and temperature', async () => {
    const run = runWithFlows('both');
    const { llm, inputs } = fakeLlm();
    const ctx: StageContext = {
      run,
      config,
      llm,
      interactive: false,
      backend: 'meta',
    };

    await runBrief(ctx);
    await runTheme(ctx, inventory);

    expect(readArtifact<Brief>(run, 'design-brief')).toMatchObject({
      meta: {
        version: 1,
        stage: 'design-brief',
        inputs: { 'flows-scope': { version: 1 } },
      },
      data: brief,
    });
    expect(readArtifact<Theme>(run, 'design-theme')).toMatchObject({
      meta: {
        version: 1,
        stage: 'design-theme',
        inputs: {
          'design-brief': { version: 1 },
          'flows-scope': {},
          'flows-reconcile': {},
        },
      },
      data: buildTheme(brief, call),
    });
    // A clean draft ends after round 2's two reviews.
    expect(
      inputs.map((input) => [
        input.stage,
        input.model,
        input.reasoningEffort,
        input.temperature,
        input.maxTokens,
      ]),
    ).toEqual([
      ['design-brief', 'strong', 'high', 0.7, 16_384],
      ['design-brief-review-peer', 'default', 'medium', undefined, 8192],
      ['design-brief-review-output', 'default', 'medium', undefined, 8192],
      ['design-theme', 'default', 'medium', undefined, 16_384],
      ['design-theme-review-peer', 'default', 'medium', undefined, 8192],
      ['design-theme-review-output', 'default', 'medium', undefined, 8192],
    ]);
    expect(inputs[0]?.messages[1]?.content).toContain('A reading list for one reader.');
    expect(inputs[3]?.messages[1]?.content).toContain('# Brief (02-design/01-brief.json)');
    const { stages } = readState(run);
    expect(stages['design-brief']).toMatchObject({ status: 'done', rounds: 2, known: 0 });
    expect(stages['design-theme']).toMatchObject({ status: 'done', rounds: 2, known: 0 });
    expect(briefStage.validate?.(run)).toEqual([]);
  });
});
