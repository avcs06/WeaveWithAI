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
import { readArtifact } from '../../core/artifacts';
import type { Config } from '../../core/env';
import type { GenerateInput, Llm } from '../../core/llm';
import { createRun, readState, runPath } from '../../core/run';
import type { StageContext } from '../index';
import {
  catalogStage,
  expandStage,
  flowsStage,
  readAnswers,
  scopeStage,
  terminalAsk,
} from './stage';
import { Catalog, Flows, type Question, Scope } from './schema';

const root = mkdtempSync(path.join(tmpdir(), 'weave-flows-stage-'));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '<!-- test -->\n\nA reading list for one reader.\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8'),
  );
const scopeFixture = Scope.parse(load('reading-list.scope.json'));
const flowsFixture = Flows.parse(load('reading-list.flows.json'));
const catalogFixture = Catalog.parse(load('reading-list.catalog.json'));

const config = { MODEL_API_KEY: 'k', LLM_BACKEND: 'meta' } as Config;
const emptyPatch = {
  upsertFlows: [],
  upsertFields: [],
  upsertForms: [],
  upsertSubflows: [],
  removeFlows: [],
  assumptions: [],
  questions: [],
};

/** Answers by schema: the fixtures for scope and catalog, the fixture flows named in the message for a batch, nothing to review or patch. */
function fakeLlm() {
  const inputs: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      inputs.push({
        ...input,
        messages: [...input.messages],
      } as GenerateInput<unknown>);
      const user = input.messages.at(-1)?.content ?? '';
      const answers: Record<string, () => unknown> = {
        Scope: () => scopeFixture,
        FlowCatalog: () => catalogFixture,
        FlowBatch: () => {
          const ids =
            /Write the full flows ((?:F\d{2,}(?:, )?)+)/
              .exec(user)?.[1]
              ?.split(', ') ?? [];
          return {
            flows: flowsFixture.flows.filter((flow) => ids.includes(flow.id)),
            newFields: [],
            newForms: [],
            newSubflows: [],
          };
        },
        FlowsPatch: () => emptyPatch,
        Review: () => ({ blockers: [] }),
      };
      const data = answers[input.schemaName]?.();
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

describe('the four stages', () => {
  it('scope, catalog, expansion in batches and reconciliation write their artifacts, markdown and state', async () => {
    const run = createRun({ idea, runsDir: root, id: 'all' });
    const { llm, inputs } = fakeLlm();
    const ctx: StageContext = {
      run,
      config,
      llm,
      interactive: false,
      backend: 'meta',
    };

    await scopeStage.run(ctx);
    await catalogStage.run(ctx);
    await expandStage.run(ctx);
    await flowsStage.run(ctx);

    expect(readArtifact<Catalog>(run, 'flows-catalog').meta).toMatchObject({
      version: 1,
      stage: 'flows-catalog',
      inputs: { scope: { version: 1 } },
    });
    expect(
      readArtifact<Flows>(run, 'flows-draft').data.flows.map((flow) => flow.id),
    ).toEqual(['F01', 'F02', 'F03', 'F04', 'F05', 'F06']);
    expect(readArtifact<Flows>(run, 'flows').meta).toMatchObject({
      version: 1,
      inputs: { 'flows-draft': { version: 1 } },
    });
    expect(readFileSync(runPath(run, '01-flows-catalog.md'), 'utf8')).toContain(
      '## Flows',
    );
    expect(readFileSync(runPath(run, '01-flows.md'), 'utf8')).toContain(
      '## F03 Add a book to the reading list',
    );
    expect(readAnswers(run)).toEqual({});

    const stages = readState(run).stages;
    expect(stages['flows-expand']).toMatchObject({
      status: 'done',
      batches: 1,
      known: 0,
    });
    expect(stages['flows-expand-1']).toMatchObject({
      status: 'done',
      rounds: 2,
      known: 0,
    });
    // Reconciliation starts from the draft: one validation round, nothing generated, no reviewers.
    expect(stages.flows).toMatchObject({ status: 'done', rounds: 1, known: 0 });

    const calls = inputs.map((input) => input.stage);
    expect(calls).toEqual([
      'scope',
      'scope-review1',
      'scope-review2',
      'flows-catalog',
      'flows-catalog-review1',
      'flows-catalog-review2',
      'flows-expand-1',
      'flows-expand-1-review1',
      'flows-expand-1-review2',
    ]);
    expect(inputs[6]?.messages[1]?.content).toContain(
      'Write the full flows F01, F02, F03, F04, F05, F06',
    );
  });

  it('validate reruns the rules on the stored artifacts', () => {
    const run = createRun({ idea, runsDir: root, id: 'validate' });
    expect(() => scopeStage.validate?.(run)).toThrow();
    writeFileSync(
      runPath(run, '01-scope.json'),
      JSON.stringify({ meta: {}, data: scopeFixture }),
    );
    writeFileSync(
      runPath(run, '01-flows-catalog.json'),
      JSON.stringify({ meta: {}, data: catalogFixture }),
    );
    writeFileSync(
      runPath(run, '01-flows.json'),
      JSON.stringify({ meta: {}, data: flowsFixture }),
    );
    expect(scopeStage.validate?.(run)).toEqual([]);
    expect(
      catalogStage
        .validate?.(run)
        ?.filter((issue) => issue.severity === 'mandatory'),
    ).toEqual([]);
    expect(
      flowsStage
        .validate?.(run)
        ?.filter((issue) => issue.severity === 'mandatory'),
    ).toEqual([]);
    expect(existsSync(runPath(run, 'input', 'idea.md'))).toBe(true);
  });
});

describe('terminalAsk', () => {
  const questions: Question[] = [
    {
      id: 'Q01',
      question: 'Ratings?',
      whyItMatters: 'Adds a field.',
      defaultAnswer: 'No ratings.',
      blocking: true,
    },
    {
      id: 'Q02',
      question: 'Dark mode?',
      whyItMatters: 'Looks.',
      defaultAnswer: 'Later.',
      blocking: false,
    },
    {
      id: 'Q03',
      question: 'Shared lists?',
      whyItMatters: 'Changes ownership.',
      defaultAnswer: 'No.',
      blocking: true,
    },
  ];

  it('asks only blocking, unanswered questions once; Enter keeps the default', async () => {
    const prompts: string[] = [];
    const typed = ['', 'Yes, one shared list'];
    const ask = terminalAsk(
      {},
      async (prompt) => (prompts.push(prompt), typed.shift() ?? ''),
      () => {},
    );

    expect(await ask({ questions })).toEqual({
      Q01: { question: 'Ratings?', answer: 'No ratings.' },
      Q03: { question: 'Shared lists?', answer: 'Yes, one shared list' },
    });
    expect(prompts).toHaveLength(2);
    expect(await ask({ questions })).toEqual({});
  });

  it('skips a question already answered in an earlier run, by its text', async () => {
    const ask = terminalAsk(
      { Q01: { question: 'Ratings?', answer: 'No.' } },
      async () => 'typed',
      () => {},
    );
    expect(await ask({ questions })).toEqual({
      Q03: { question: 'Shared lists?', answer: 'typed' },
    });
  });
});
