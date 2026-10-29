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
import { flowsStage, readAnswers, scopeStage, terminalAsk } from './stage';
import { Flows, type Question, Scope } from './schema';

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

const config = { MODEL_API_KEY: 'k', LLM_BACKEND: 'meta' } as Config;

/** Answers by schema: the fixtures for the stages, an empty review for the reviewers. */
function fakeLlm() {
  const inputs: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      inputs.push({
        ...input,
        messages: [...input.messages],
      } as GenerateInput<unknown>);
      const data = {
        Scope: scopeFixture,
        Flows: flowsFixture,
        Review: { blockers: [] },
      }[input.schemaName];
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

describe('scope and flows stages', () => {
  it('write both artifacts, their markdown, the answers file and the run state', async () => {
    const run = createRun({ idea, runsDir: root, id: 'both' });
    const { llm, inputs } = fakeLlm();
    const ctx: StageContext = {
      run,
      config,
      llm,
      interactive: false,
      backend: 'meta',
    };

    await scopeStage.run(ctx);
    await flowsStage.run(ctx);

    expect(readArtifact<Scope>(run, 'scope').meta).toMatchObject({
      version: 1,
      stage: 'scope',
      model: 'muse-spark-1.3',
      rounds: 2,
    });
    expect(readArtifact<Flows>(run, 'flows').meta).toMatchObject({
      version: 1,
      inputs: { scope: { version: 1 } },
    });
    expect(readFileSync(runPath(run, '01-scope.md'), 'utf8')).toContain(
      '# Shelf: scope',
    );
    expect(readFileSync(runPath(run, '01-flows.md'), 'utf8')).toContain(
      '## F03 Add a book to the reading list',
    );
    expect(readAnswers(run)).toEqual({});
    expect(readState(run).stages).toMatchObject({
      scope: { status: 'done', known: 0 },
      flows: { status: 'done', known: 0 },
    });
    // Generator, two reviewers, per stage; the flows reviewers saw the scope JSON.
    expect(inputs.map((input) => input.stage)).toEqual([
      'scope',
      'scope-review1',
      'scope-review2',
      'flows',
      'flows-review1',
      'flows-review2',
    ]);
    expect(inputs[3]?.messages[1]?.content).toContain(
      '# Scope (01-scope.json)',
    );
    expect(inputs[4]?.messages[0]?.content).toContain(
      'Challenge, and report as a blocker',
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
      runPath(run, '01-flows.json'),
      JSON.stringify({ meta: {}, data: flowsFixture }),
    );
    expect(scopeStage.validate?.(run)).toEqual([]);
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

  it('skips a question answered in an earlier run, but not an id reused for another question', async () => {
    const ask = terminalAsk(
      {
        Q01: { question: 'Ratings?', answer: 'No.' },
        Q03: { question: 'Export?', answer: 'No.' },
      },
      async () => 'typed',
      () => {},
    );
    expect(await ask({ questions })).toEqual({
      Q03: { question: 'Shared lists?', answer: 'typed' },
    });
  });
});
