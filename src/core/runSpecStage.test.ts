import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { type Issue, readReport } from './issues';
import type { GenerateInput, Llm } from './llm';
import type { Review } from './review';
import { createRun, readEvents, readState } from './run';
import { type Answers, runSpecStage } from './runSpecStage';

const root = mkdtempSync(path.join(tmpdir(), 'weave-stage-'));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '# Idea\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const Doc = z.object({ title: z.string() });
type Doc = z.infer<typeof Doc>;

const missingTitle: Issue = {
  rule: 'DOC-001',
  severity: 'mandatory',
  message: 'title must not be empty',
  at: 'title',
};
const longTitle: Issue = {
  rule: 'DOC-002',
  severity: 'warning',
  message: 'title is long',
};
const clean: Review = { blockers: [] };
const generic: Review = {
  blockers: [
    { at: 'title', problem: 'Title is generic.', fix: 'Name the breed.' },
  ],
};
const genericIssue: Issue = {
  rule: 'REVIEW',
  severity: 'mandatory',
  message: 'Title is generic. Fix: Name the breed.',
  at: 'title',
};

/** An llm that returns scripted outputs, generator and reviewer alike, and keeps every input it was given. */
function fakeLlm(outputs: Array<Doc | Review>) {
  const inputs: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      // The runner reuses one messages array across rounds; keep what this call saw.
      inputs.push({
        ...input,
        messages: [...input.messages],
      } as GenerateInput<unknown>);
      const data = outputs[inputs.length - 1];
      if (!data) throw new Error('script exhausted');
      const model =
        input.model === 'strong' ? 'muse-wonder-1.0' : 'muse-spark-1.3';
      return {
        data: data as never,
        raw: JSON.stringify(data),
        usage: { input: 10, cachedInput: 0, output: 5 },
        costUsd: 0.001,
        replayed: false,
        backend: 'meta',
        model,
        durationMs: 1,
      };
    },
  };
  return { llm, inputs };
}

function stage(
  id: string,
  llm: Llm,
  validate: (doc: Doc) => Issue[],
  review?: string,
) {
  const run = createRun({ idea, runsDir: root, id });
  const promise = runSpecStage({
    run,
    stage: 'doc',
    schema: Doc,
    schemaName: 'Doc',
    system: 'Write a doc.',
    user: 'About cats.',
    validate,
    review,
    llm,
  });
  return { run, promise };
}

const requireTitle = (doc: Doc): Issue[] => (doc.title ? [] : [missingTitle]);
const guide = 'Look for: a title that says nothing. Ignore: length.';
const lastUser = (input: GenerateInput<unknown> | undefined) =>
  input?.messages.at(-1)?.content ?? '';

describe('runSpecStage with reviewers', () => {
  it('reviews a clean first draft twice in round 2 and ends when both reviews are empty', async () => {
    const { llm, inputs } = fakeLlm([{ title: 'Cats' }, clean, clean]);
    const { run, promise } = stage('clean', llm, () => [longTitle], guide);
    const result = await promise;

    expect(result).toEqual({
      output: { title: 'Cats' },
      warnings: [longTitle],
      known: [],
      answers: {},
      model: 'muse-spark-1.3',
      rounds: 2,
    });
    expect(inputs.map((input) => input.stage)).toEqual([
      'doc',
      'doc-review1',
      'doc-review2',
    ]);
    expect(
      inputs
        .slice(1)
        .map((input) => [
          input.round,
          input.model,
          input.temperature,
          input.reasoningEffort,
          input.maxTokens,
          input.schemaName,
        ]),
    ).toEqual([
      [2, 'default', 0.7, 'medium', 8192, 'Review'],
      [2, 'default', 0.7, 'medium', 8192, 'Review'],
    ]);
    const review1 = lastUser(inputs[1]);
    expect(review1).toContain('Reviewer 1 of 2');
    expect(lastUser(inputs[2])).toContain('Reviewer 2 of 2');
    expect(review1).toContain('Write a doc.');
    expect(review1).toContain('About cats.');
    expect(review1).toContain('{"title":"Cats"}');
    expect(review1).toContain('- DOC-002: title is long');
    expect(inputs[1]?.messages[0]?.content).toContain(guide);

    expect(readEvents(run).map((event) => event.type)).toEqual([
      'stage:start',
      'llm:call',
      'stage:round',
      'llm:call',
      'llm:call',
      'stage:round',
      'stage:done',
    ]);
    expect(
      readEvents(run)
        .filter((event) => event.type === 'stage:round')
        .map((event) => event.generated),
    ).toEqual([true, false]);
    expect(readState(run).stages.doc).toMatchObject({ rounds: 2, known: 0 });
  });

  it('fixes validator issues in round 2, a blocker in round 3 on the strong model, and ends after a clean review', async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      { title: 'Cats' },
      clean,
      generic,
      { title: 'Siamese cats' },
      clean,
    ]);
    const { run, promise } = stage('fixed', llm, requireTitle, guide);
    const result = await promise;

    expect(result).toEqual({
      output: { title: 'Siamese cats' },
      warnings: [],
      known: [],
      answers: {},
      model: 'muse-wonder-1.0',
      rounds: 3,
    });
    expect(inputs.map((input) => input.stage)).toEqual([
      'doc',
      'doc',
      'doc-review1',
      'doc-review2',
      'doc',
      'doc-review1',
    ]);
    expect(inputs.map((input) => input.model)).toEqual([
      'default',
      'default',
      'default',
      'default',
      'strong',
      'default',
    ]);
    expect(lastUser(inputs[1])).toContain(
      '- DOC-001 at title: title must not be empty',
    );
    expect(lastUser(inputs[4])).toContain(
      '- REVIEW at title: Title is generic. Fix: Name the breed.',
    );
    expect(lastUser(inputs[4])).not.toContain('DOC-001');
    expect(readReport(run, 'doc')?.rounds).toEqual([
      { round: 1, issues: [missingTitle] },
      { round: 2, issues: [genericIssue] },
      { round: 3, issues: [] },
    ]);
  });

  it('reviews the round-2 fix even when it still fails validation', async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      { title: '' },
      clean,
      clean,
      { title: 'Cats' },
      clean,
    ]);
    const { run, promise } = stage('parallel', llm, requireTitle, guide);
    const result = await promise;

    expect(inputs.map((input) => input.stage)).toEqual([
      'doc',
      'doc',
      'doc-review1',
      'doc-review2',
      'doc',
      'doc-review1',
    ]);
    expect(result).toMatchObject({
      output: { title: 'Cats' },
      known: [],
      rounds: 3,
    });
    expect(
      readEvents(run)
        .filter((event) => event.type === 'stage:round')
        .map((event) => [event.mandatory, event.blockers]),
    ).toEqual([
      [1, 0],
      [1, 0],
      [0, 0],
    ]);
  });

  it('runs the final fix in round 4 and records what is left as known, without throwing', async () => {
    const { llm, inputs } = fakeLlm([
      { title: 'Cats' },
      generic,
      clean,
      { title: 'Cat' },
      generic,
      { title: 'Cats!' },
    ]);
    const { run, promise } = stage('known', llm, requireTitle, guide);
    const result = await promise;

    expect(inputs.map((input) => input.stage)).toEqual([
      'doc',
      'doc-review1',
      'doc-review2',
      'doc',
      'doc-review1',
      'doc',
    ]);
    expect(result.rounds).toBe(4);
    expect(result.output).toEqual({ title: 'Cats!' });
    expect(result.known).toEqual([
      {
        ...genericIssue,
        message: `${genericIssue.message} (addressed in the final fix, not re-reviewed)`,
      },
    ]);
    expect(readState(run).stages.doc).toMatchObject({ rounds: 4, known: 1 });
    expect(readEvents(run).at(-1)).toMatchObject({
      type: 'stage:done',
      rounds: 4,
      known: 1,
    });
  });
});

describe('runSpecStage with questions (interactive)', () => {
  const opts = (
    run: ReturnType<typeof createRun>,
    llm: Llm,
    extra: Partial<Parameters<typeof runSpecStage<Doc>>[0]>,
  ) => ({
    run,
    stage: 'doc',
    schema: Doc,
    schemaName: 'Doc',
    system: 'Write a doc.',
    user: 'About cats.',
    validate: requireTitle,
    llm,
    ...extra,
  });

  it('asks after each generation, rides the answers along with the next fix, and never forces a generation', async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      { title: 'Cats' },
      clean,
      clean,
    ]);
    const asked: Doc[] = [];
    const run = createRun({ idea, runsDir: root, id: 'asked' });
    const result = await runSpecStage(
      opts(run, llm, {
        review: guide,
        ask: async (draft): Promise<Answers> => {
          asked.push(draft);
          return asked.length === 1
            ? { Q01: { question: 'Breed?', answer: 'Siamese' } }
            : { Q02: { question: 'Kittens?', answer: 'no' } };
        },
      }),
    );

    expect(asked).toEqual([{ title: '' }, { title: 'Cats' }]);
    expect(result).toMatchObject({
      output: { title: 'Cats' },
      answers: {
        Q01: { question: 'Breed?', answer: 'Siamese' },
        Q02: { question: 'Kittens?', answer: 'no' },
      },
      known: [],
      rounds: 2,
    });
    expect(inputs.map((input) => input.stage)).toEqual([
      'doc',
      'doc',
      'doc-review1',
      'doc-review2',
    ]);
    const fixup = lastUser(inputs[1]);
    expect(fixup).toContain('- DOC-001 at title: title must not be empty');
    expect(fixup).toContain('Answers the user gave to your questions');
    expect(fixup).toContain('- Q01 "Breed?": Siamese');
    expect(fixup).not.toContain('Q02');
    expect(
      readEvents(run).filter((event) => event.type === 'stage:answers'),
    ).toHaveLength(2);
  });

  it('carries answers forward unapplied when nothing is pending', async () => {
    const { llm, inputs } = fakeLlm([{ title: 'Cats' }]);
    const run = createRun({ idea, runsDir: root, id: 'carried' });
    const result = await runSpecStage(
      opts(run, llm, {
        ask: async () => ({ Q01: { question: 'Breed?', answer: 'yes' } }),
      }),
    );

    expect(result).toMatchObject({
      output: { title: 'Cats' },
      answers: { Q01: { question: 'Breed?', answer: 'yes' } },
      rounds: 1,
    });
    expect(inputs).toHaveLength(1);
  });
});

describe('runSpecStage without a review guide', () => {
  it('ends after round 1 when validation is clean', async () => {
    const { llm, inputs } = fakeLlm([{ title: 'Cats' }]);
    const { run, promise } = stage('warned', llm, () => [longTitle]);

    expect(await promise).toEqual({
      output: { title: 'Cats' },
      warnings: [longTitle],
      known: [],
      answers: {},
      model: 'muse-spark-1.3',
      rounds: 1,
    });
    expect(inputs).toHaveLength(1);
    expect(readEvents(run).map((event) => event.type)).toEqual([
      'stage:start',
      'llm:call',
      'stage:round',
      'stage:done',
    ]);
  });

  it('sends only the mandatory issues back and ends in round 2', async () => {
    const { llm, inputs } = fakeLlm([{ title: '' }, { title: 'Cats' }]);
    const { promise } = stage('fixed-plain', llm, (doc) => [
      ...requireTitle(doc),
      longTitle,
    ]);

    expect(await promise).toEqual({
      output: { title: 'Cats' },
      warnings: [longTitle],
      known: [],
      answers: {},
      model: 'muse-spark-1.3',
      rounds: 2,
    });
    const messages = inputs[1]?.messages ?? [];
    expect(messages[2]).toEqual({ role: 'assistant', content: '{"title":""}' });
    expect(messages[3]?.content).toContain(
      'return the complete corrected JSON',
    );
    expect(messages[3]?.content).toContain(
      '- DOC-001 at title: title must not be empty',
    );
    expect(messages[3]?.content).not.toContain('DOC-002');
    expect(messages[3]?.content).toContain(
      'keep the question in the output:\nNone.',
    );
  });

  it('keeps an issue that never clears as known after four generations', async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      { title: '' },
      { title: '' },
      { title: '' },
    ]);
    const { run, promise } = stage('stuck', llm, requireTitle);
    const result = await promise;

    expect(result).toMatchObject({ known: [missingTitle], rounds: 4 });
    expect(inputs.map((input) => input.model)).toEqual([
      'default',
      'default',
      'strong',
      'strong',
    ]);
    expect(readReport(run, 'doc')?.rounds.map((entry) => entry.round)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(readState(run).stages.doc).toMatchObject({ rounds: 4, known: 1 });
  });
});
