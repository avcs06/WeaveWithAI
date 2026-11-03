import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { type Issue, readReport, writeReport } from '../core/issues';
import { type GenerateInput, type Llm, ModelOutputInvalid, ModelOutputTruncated } from '../core/llm';
import type { Review } from './review';
import type { Thread } from './threads';
import { createRun, readEvents, readState } from '../core/run';
import {
  type Answers,
  type Compose,
  type ReviewGuides,
  runSpecStage,
  type SpecStageOptions,
} from './runSpecStage';

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
const clean: Review = { checked: [], blockers: [], replies: [] };
const generic: Review = {
  checked: [],
  replies: [],
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

/** An llm that returns scripted outputs, generator and reviewer alike, throws scripted errors, and keeps every input it was given. */
function fakeLlm(outputs: Array<Doc | Review | Error>) {
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
      if (data instanceof Error) throw data;
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
  review?: ReviewGuides,
  extra?: Partial<SpecStageOptions<Doc>>,
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
    ...extra,
  });
  return { run, promise };
}

const requireTitle = (doc: Doc): Issue[] => (doc.title ? [] : [missingTitle]);
const guide: ReviewGuides = {
  peer: 'Challenge: whether cats are the right subject.',
  output: 'Look for: a title that says nothing. Ignore: length.',
};
const lastUser = (input: GenerateInput<unknown> | undefined) =>
  input?.messages.at(-1)?.content ?? '';

describe('runSpecStage with reviewers', () => {
  it('reviews a clean first draft by the peer and the output reviewer in round 1 and ends when both reviews are empty', async () => {
    const { llm, inputs } = fakeLlm([{ title: 'Cats' }, clean, clean]);
    const { run, promise } = stage('clean', llm, () => [longTitle], guide);
    const result = await promise;

    expect(result).toEqual({
      output: { title: 'Cats' },
      warnings: [longTitle],
      known: [],
      answers: {},
      model: 'muse-spark-1.3',
      rounds: 1,
    });
    expect(inputs.map((input) => input.stage)).toEqual([
      'doc',
      'doc-review-peer',
      'doc-review-output',
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
      [1, 'default', undefined, 'medium', 16_384, 'Review'],
      [1, 'default', undefined, 'medium', 16_384, 'Review'],
    ]);
    // Both read the same input; each has its own guide.
    const review1 = lastUser(inputs[1]);
    expect(lastUser(inputs[2])).toBe(review1);
    expect(review1).toContain('Write a doc.');
    expect(review1).toContain('About cats.');
    expect(review1).toContain('{"title":"Cats"}');
    expect(review1).toContain('- DOC-002: title is long');
    expect(inputs[1]?.messages[0]?.content).toContain(guide.peer);
    expect(inputs[1]?.messages[0]?.content).not.toContain(guide.output);
    expect(inputs[2]?.messages[0]?.content).toContain(guide.output);

    expect(readEvents(run).map((event) => event.type)).toEqual([
      'stage:start',
      'round:start',
      'llm:call',
      'round:validated',
      'review:start',
      'review:start',
      'llm:call',
      'llm:call',
      'stage:round',
      'stage:done',
    ]);
    expect(
      readEvents(run)
        .filter((event) => event.reviewer)
        .map((event) => [event.type, event.reviewer, event.blockers]),
    ).toEqual([
      ['review:start', 'peer', undefined],
      ['review:start', 'output', undefined],
      ['llm:call', 'peer', 0],
      ['llm:call', 'output', 0],
    ]);
    expect(
      readEvents(run)
        .filter((event) => event.type === 'stage:round')
        .map((event) => event.generated),
    ).toEqual([true]);
    expect(readState(run).stages.doc).toMatchObject({ rounds: 1, known: 0 });
  });

  it("gives the stage's temperature to the first draft, and fixes and reviewers the default", async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      clean,
      clean,
      { title: 'Cats' },
      clean,
      clean,
    ]);
    const run = createRun({ idea, runsDir: root, id: 'temperature' });
    await runSpecStage({
      run,
      stage: 'doc',
      schema: Doc,
      schemaName: 'Doc',
      system: 'Write a doc.',
      user: 'About cats.',
      validate: requireTitle,
      review: guide,
      temperature: 0.7,
      llm,
    });

    expect(inputs.map((input) => [input.stage, input.temperature])).toEqual([
      ['doc', 0.7],
      ['doc-review-peer', undefined],
      ['doc-review-output', undefined],
      ['doc', undefined],
      ['doc-review-peer', undefined],
      ['doc-review-output', undefined],
    ]);
  });

  it('runs only the output reviewer when the stage gives no peer guide', async () => {
    const { llm, inputs } = fakeLlm([{ title: '' }, clean, { title: 'Cats' }, clean]);
    const { promise } = stage('output-only', llm, requireTitle, { output: guide.output });
    const result = await promise;

    expect(inputs.map((input) => [input.stage, input.round])).toEqual([
      ['doc', 1],
      ['doc-review-output', 1],
      ['doc', 2],
      ['doc-review-output', 2],
    ]);
    expect(result).toMatchObject({ output: { title: 'Cats' }, rounds: 2 });
  });

  it('runs only the first draft on the draft model; fixes and reviewers use the default', async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      clean,
      clean,
      { title: '' },
      clean,
      clean,
      { title: 'Cats' },
    ]);
    const { promise } = stage('draft-model', llm, requireTitle, guide, {
      draftModel: 'strong',
    });
    await promise;

    expect(
      inputs.map((input) => [input.stage, input.round, input.model]),
    ).toEqual([
      ['doc', 1, 'strong'],
      ['doc-review-peer', 1, 'default'],
      ['doc-review-output', 1, 'default'],
      ['doc', 2, 'default'],
      ['doc-review-peer', 2, 'default'],
      ['doc-review-output', 2, 'default'],
      ['doc', 3, 'default'],
    ]);
  });

  it("runs the first draft at the stage's effort and a fix at medium, and leaves both unset when the stage sets none", async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      clean,
      clean,
      { title: 'Cats' },
      clean,
      clean,
    ]);
    const { promise } = stage('effort', llm, requireTitle, guide, {
      reasoningEffort: 'high',
    });
    await promise;

    expect(
      inputs.map((input) => [input.stage, input.round, input.reasoningEffort]),
    ).toEqual([
      ['doc', 1, 'high'],
      ['doc-review-peer', 1, 'medium'],
      ['doc-review-output', 1, 'medium'],
      ['doc', 2, 'medium'],
      ['doc-review-peer', 2, 'medium'],
      ['doc-review-output', 2, 'medium'],
    ]);

    const unset = fakeLlm([{ title: '' }, { title: 'Cats' }]);
    await stage('effort-unset', unset.llm, requireTitle).promise;
    expect(unset.inputs.map((input) => input.reasoningEffort)).toEqual([
      undefined,
      undefined,
    ]);
  });

  it('fixes the validator issues and a blocker of round 1 together in round 2, and ends after a clean review', async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      clean,
      generic,
      { title: 'Siamese cats' },
      clean,
      clean,
    ]);
    const { run, promise } = stage('fixed', llm, requireTitle, guide);
    const result = await promise;

    expect(result).toEqual({
      output: { title: 'Siamese cats' },
      warnings: [],
      known: [],
      answers: {},
      model: 'muse-spark-1.3',
      rounds: 2,
    });
    expect(inputs.map((input) => input.stage)).toEqual([
      'doc',
      'doc-review-peer',
      'doc-review-output',
      'doc',
      'doc-review-peer',
      'doc-review-output',
    ]);
    expect(inputs.map((input) => input.model)).toEqual([
      'default',
      'default',
      'default',
      'default',
      'default',
      'default',
    ]);
    expect(lastUser(inputs[3])).toContain(
      '- T01: DOC-001 at title: title must not be empty',
    );
    expect(lastUser(inputs[3])).toContain(
      '- T02: REVIEW at title: Title is generic. Fix: Name the breed.',
    );
    expect(readReport(run, 'doc')?.rounds).toEqual([
      { round: 1, issues: [missingTitle, genericIssue] },
      { round: 2, issues: [] },
    ]);
  });

  it('reviews the round-2 fix even when it still fails validation', async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      clean,
      clean,
      { title: '' },
      clean,
      clean,
      { title: 'Cats' },
    ]);
    const { run, promise } = stage('parallel', llm, requireTitle, guide);
    const result = await promise;

    expect(inputs.map((input) => input.stage)).toEqual([
      'doc',
      'doc-review-peer',
      'doc-review-output',
      'doc',
      'doc-review-peer',
      'doc-review-output',
      'doc',
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

  it('runs the final fix in round 3 and records what is left as known, without throwing', async () => {
    const { llm, inputs } = fakeLlm([
      { title: 'Cats' },
      generic,
      clean,
      { title: 'Cat' },
      clean,
      generic,
      { title: 'Cats!' },
    ]);
    const { run, promise } = stage('known', llm, requireTitle, guide);
    const result = await promise;

    expect(inputs.map((input) => input.stage)).toEqual([
      'doc',
      'doc-review-peer',
      'doc-review-output',
      'doc',
      'doc-review-peer',
      'doc-review-output',
      'doc',
    ]);
    expect(result.rounds).toBe(3);
    expect(result.output).toEqual({ title: 'Cats!' });
    expect(result.known).toEqual([
      {
        ...genericIssue,
        message: `${genericIssue.message} (addressed in the final fix, not re-reviewed)`,
      },
    ]);
    expect(readState(run).stages.doc).toMatchObject({ rounds: 3, known: 1 });
    expect(readEvents(run).at(-1)).toMatchObject({
      type: 'stage:done',
      rounds: 3,
      known: 1,
    });
  });

  it('runs both reviewers again in round 2 and stops after the final fix in round 3', async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      clean,
      clean,
      { title: '' },
      clean,
      clean,
      { title: '' },
    ]);
    const { promise } = stage('three-rounds', llm, requireTitle, guide);
    const result = await promise;

    expect(inputs.map((input) => [input.stage, input.round])).toEqual([
      ['doc', 1],
      ['doc-review-peer', 1],
      ['doc-review-output', 1],
      ['doc', 2],
      ['doc-review-peer', 2],
      ['doc-review-output', 2],
      ['doc', 3],
    ]);
    expect(result).toMatchObject({ known: [missingTitle], rounds: 3 });
  });

  it('uses the default model for every call when no draft model is set, rounds 2 to 3 included', async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      generic,
      clean,
      { title: 'Cat' },
      clean,
      generic,
      { title: 'Cats!' },
    ]);
    const { promise } = stage('no-strong', llm, requireTitle, guide);
    await promise;

    expect(inputs.map((input) => [input.round, input.model])).toEqual([
      [1, 'default'],
      [1, 'default'],
      [1, 'default'],
      [2, 'default'],
      [2, 'default'],
      [2, 'default'],
      [3, 'default'],
    ]);
    // The final fix takes round 2's blocker and not the validator issue round 2's fix cleared.
    expect(lastUser(inputs[6])).toContain('- T03: REVIEW at title: Title is generic. Fix: Name the breed.');
    expect(lastUser(inputs[6])).not.toContain('DOC-001');
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
      clean,
      clean,
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
      'doc-review-peer',
      'doc-review-output',
      'doc',
      'doc-review-peer',
      'doc-review-output',
    ]);
    const fixup = lastUser(inputs[3]);
    expect(fixup).toContain('- T01: DOC-001 at title: title must not be empty');
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

describe('runSpecStage reports', () => {
  it('starts a fresh report on a rerun of the same stage', async () => {
    const { llm } = fakeLlm([{ title: 'Cats' }, { title: 'Cats' }]);
    const run = createRun({ idea, runsDir: root, id: 'rerun' });
    const options = {
      run,
      stage: 'doc',
      schema: Doc,
      schemaName: 'Doc',
      system: 'Write a doc.',
      user: 'About cats.',
      validate: () => [longTitle],
      llm,
    };
    await runSpecStage(options);
    writeReport(run, 'doc', 7, [missingTitle]); // a stale round from an earlier, longer run
    await runSpecStage(options);
    expect(readReport(run, 'doc')?.rounds.map((entry) => entry.round)).toEqual([
      1,
    ]);
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
      'round:start',
      'llm:call',
      'round:validated',
      'stage:round',
      'stage:done',
    ]);
    expect(readEvents(run).find((event) => event.type === 'round:validated')).toMatchObject({
      round: 1,
      mandatory: 0,
      warnings: 1,
      rules: [],
    });
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
      'Return the complete corrected document as JSON.',
    );
    expect(messages[3]?.content).toContain(
      '- T01: DOC-001 at title: title must not be empty',
    );
    expect(messages[3]?.content).not.toContain('DOC-002');
    expect(messages[3]?.content).toContain(
      'Answers the user gave to your questions:\nNone.',
    );
  });

  it('keeps an issue that never clears as known after three generations', async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      { title: '' },
      { title: '' },
    ]);
    const { run, promise } = stage('stuck', llm, requireTitle);
    const result = await promise;

    expect(result).toMatchObject({ known: [missingTitle], rounds: 3 });
    expect(inputs.map((input) => input.model)).toEqual([
      'default',
      'default',
      'default',
    ]);
    expect(readReport(run, 'doc')?.rounds.map((entry) => entry.round)).toEqual([
      1, 2, 3,
    ]);
    expect(readState(run).stages.doc).toMatchObject({ rounds: 3, known: 1 });
  });
});

describe('runSpecStage with compose', () => {
  it('compose: round 1 validates the draft; a fix uses compose.fix with the pending issues', async () => {
    const { llm, inputs } = fakeLlm([{ title: 'Cats' }]);
    const run = createRun({ idea, runsDir: root, id: 'composed-fix' });
    const fixes: Thread[][] = [];
    const compose: Compose<Doc> = {
      draft: async () => ({ data: { title: '' }, raw: '{"title":""}', model: 'none' }),
      async fix(call, _current, pending) {
        fixes.push(pending);
        const result = await call({
          stage: 'doc-fix',
          schema: Doc,
          schemaName: 'Doc',
          messages: [{ role: 'user', content: 'fix' }],
        });
        return { data: result.data, raw: result.raw, model: result.model };
      },
    };
    const result = await runSpecStage({
      run,
      stage: 'doc',
      schema: Doc,
      schemaName: 'Doc',
      system: 'Write a doc.',
      user: 'About cats.',
      validate: requireTitle,
      compose,
      llm,
    });

    expect(result).toMatchObject({
      output: { title: 'Cats' },
      known: [],
      rounds: 2,
    });
    // The fix takes the validator's issue as its thread, with nothing said about it yet.
    expect(fixes).toEqual([[{ id: 'T01', issue: missingTitle, by: 'checks', round: 1, entries: [] }]]);
    expect(inputs.map((input) => input.stage)).toEqual(['doc-fix']);
    const rounds = readEvents(run).filter(
      (event) => event.type === 'stage:round',
    );
    expect(rounds.map((event) => event.generated)).toEqual([true, true]);
  });

  it('start: round 1 validates the given document with no call, and a fix patches it', async () => {
    const { llm, inputs } = fakeLlm([{ title: 'Cats' }]);
    const run = createRun({ idea, runsDir: root, id: 'started' });
    const result = await runSpecStage({
      run,
      stage: 'doc',
      schema: Doc,
      schemaName: 'Doc',
      system: 'Write a doc.',
      user: 'About cats.',
      validate: requireTitle,
      start: { data: { title: '' }, raw: '{"title":""}', model: 'none' },
      llm,
    });

    expect(result).toMatchObject({ output: { title: 'Cats' }, known: [], rounds: 2 });
    expect(inputs).toHaveLength(1);
    const rounds = readEvents(run).filter(
      (event) => event.type === 'stage:round',
    );
    expect(rounds.map((event) => event.generated)).toEqual([false, true]);
  });

  it('compose: every call is logged, and the draft text reaches the reviewers', async () => {
    const { llm, inputs } = fakeLlm([
      { title: 'A' },
      { title: 'B' },
      clean,
      clean,
    ]);
    const run = createRun({ idea, runsDir: root, id: 'composed' });
    const compose: Compose<Doc> = {
      async draft(call) {
        const [a, b] = await Promise.all([
          call({
            stage: 'doc-part1',
            schema: Doc,
            schemaName: 'Doc',
            messages: [{ role: 'user', content: 'part 1' }],
          }),
          call({
            stage: 'doc-part2',
            schema: Doc,
            schemaName: 'Doc',
            messages: [{ role: 'user', content: 'part 2' }],
          }),
        ]);
        const data = { title: `${a.data.title}${b.data.title}` };
        return { data, raw: JSON.stringify(data), model: a.model };
      },
      fix: () => Promise.reject(new Error('nothing to fix')),
    };
    const result = await runSpecStage({
      run,
      stage: 'doc',
      schema: Doc,
      schemaName: 'Doc',
      system: 'Write a doc.',
      user: 'About cats.',
      validate: () => [],
      review: guide,
      compose,
      llm,
    });

    expect(result.output).toEqual({ title: 'AB' });
    expect(
      readEvents(run)
        .filter((event) => event.type === 'llm:call')
        .map((event) => event.stage),
    ).toEqual([
      'doc-part1',
      'doc-part2',
      'doc-review-peer',
      'doc-review-output',
    ]);
    expect(lastUser(inputs[2])).toContain('{"title":"AB"}');
  });
});

describe('runSpecStage resumed at a round', () => {
  it('reviews the given document in that round with no generation, keeps the earlier report rounds, and fixes after it', async () => {
    const { llm, inputs } = fakeLlm([clean, clean, { title: 'Cats' }]);
    const run = createRun({ idea, runsDir: root, id: 'resumed' });
    writeReport(run, 'doc', 1, [longTitle]);
    writeReport(run, 'doc', 4, [missingTitle]); // a stale round from an earlier, longer run
    const result = await runSpecStage({
      run,
      stage: 'doc',
      schema: Doc,
      schemaName: 'Doc',
      system: 'Write a doc.',
      user: 'About cats.',
      validate: requireTitle,
      review: guide,
      resume: { round: 2, draft: { data: { title: '' }, raw: '{"title":""}', model: 'none' } },
      llm,
    });

    expect(result).toMatchObject({ output: { title: 'Cats' }, known: [], rounds: 3 });
    // Round 2: both reviewers read the given document; round 3, the final fix, fixes it and nobody reviews it.
    expect(inputs.map((input) => [input.stage, input.round])).toEqual([
      ['doc-review-peer', 2],
      ['doc-review-output', 2],
      ['doc', 3],
    ]);
    expect(lastUser(inputs[1])).toContain('{"title":""}');
    expect(readReport(run, 'doc')?.rounds).toEqual([
      { round: 1, issues: [longTitle] },
      { round: 2, issues: [missingTitle] },
      { round: 3, issues: [] },
    ]);
    const events = readEvents(run);
    expect(events.filter((e) => e.type === 'round:resumed').map((e) => e.round)).toEqual([2]);
    expect(events.filter((e) => e.type === 'round:start').map((e) => e.round)).toEqual([3]);
    expect(events.filter((e) => e.type === 'stage:round').map((e) => [e.round, e.generated])).toEqual([
      [2, true],
      [3, true],
    ]);
  });

  it('refuses a round with no reviewers, before the stage starts', async () => {
    const { llm, inputs } = fakeLlm([]);
    const run = createRun({ idea, runsDir: root, id: 'resumed-unreviewed' });
    const draft = { data: { title: 'Cats' }, raw: '{"title":"Cats"}', model: 'none' };
    const options = { run, stage: 'doc', schema: Doc, schemaName: 'Doc', system: 'Write a doc.', user: 'About cats.', validate: requireTitle, review: guide, llm };
    await expect(runSpecStage({ ...options, resume: { round: 3, draft } })).rejects.toThrow('round 3 has no reviewers');
    await expect(runSpecStage({ ...options, resume: { round: 4, draft } })).rejects.toThrow('no round 4 to resume');
    expect(inputs).toEqual([]);
    expect(readEvents(run)).toEqual([]);
  });
});

describe('runSpecStage with a model that has no price', () => {
  it('logs a warning beside a live call to it, and none for a priced or a replayed call', async () => {
    const { llm } = fakeLlm([{ title: 'Cats' }, clean, clean]);
    // Live and unpriced, live and priced, replayed and unpriced.
    const script = [
      { model: 'hackathon', replayed: false },
      { model: 'muse-spark-1.3', replayed: false },
      { model: 'hackathon', replayed: true },
    ];
    const unpriced: Llm = {
      async generateStructured(input) {
        const result = await llm.generateStructured(input);
        return { ...result, ...script.shift(), costUsd: 0 };
      },
    };
    const { run, promise } = stage('unpriced', unpriced, requireTitle, guide);
    await promise;
    const events = readEvents(run);
    expect(events.filter((event) => event.type === 'llm:call')).toHaveLength(3);
    expect(events.filter((event) => event.type === 'warning')).toEqual([
      expect.objectContaining({
        stage: 'doc',
        message:
          'hackathon has no price in src/core/prices.ts; its calls count as $0',
      }),
    ]);
  });
});

describe('runSpecStage with an answer cut at the output limit', () => {
  const cut = () =>
    new ModelOutputTruncated(
      'muse-spark-1.3 output was cut at 8192 tokens',
      'muse-spark-1.3',
      { input: 10, cachedInput: 0, output: 8192 },
      120,
    );

  it('retries a cut first draft once with the same input and finishes', async () => {
    const { llm, inputs } = fakeLlm([cut(), { title: 'Cats' }]);
    const { run, promise } = stage('cut-once', llm, () => []);

    expect(await promise).toMatchObject({
      output: { title: 'Cats' },
      rounds: 1,
    });
    expect(inputs.map((input) => [input.stage, input.round])).toEqual([
      ['doc', 1],
      ['doc', 1],
    ]);
    expect(inputs[1]).toEqual(inputs[0]);
    expect(readEvents(run).map((event) => event.type)).toEqual([
      'stage:start',
      'round:start',
      'llm:call',
      'warning',
      'llm:call',
      'round:validated',
      'stage:round',
      'stage:done',
    ]);
    const [truncated, warning, answered] = readEvents(run).slice(2, 5);
    expect(truncated).toMatchObject({
      stage: 'doc',
      round: 1,
      truncated: true,
      model: 'muse-spark-1.3',
      input: 10,
      cachedInput: 0,
      output: 8192,
      contentLength: 120,
    });
    expect(warning).toMatchObject({
      stage: 'doc',
      message:
        'doc round 1: the answer was cut at the output limit; retrying once',
    });
    expect(answered).toMatchObject({ stage: 'doc', round: 1, output: 5 });
    expect(answered).not.toHaveProperty('truncated');
  });

  it('retries once an answer the schema refuses, logging what it cost, and fails on a second', async () => {
    const invalid = () => {
      const error = new ModelOutputInvalid('output is not JSON: Unexpected token', []);
      error.paid = { model: 'muse-spark-1.3', usage: { input: 10, cachedInput: 0, output: 40 } };
      return error;
    };
    const once = fakeLlm([invalid(), { title: 'Cats' }]);
    const first = stage('invalid-once', once.llm, () => []);
    expect(await first.promise).toMatchObject({ output: { title: 'Cats' }, rounds: 1 });
    expect(once.inputs).toHaveLength(2);
    const [refused, warning] = readEvents(first.run).slice(2, 4);
    expect(refused).toMatchObject({ type: 'llm:call', invalid: true, output: 40 });
    expect(warning?.message).toContain('did not match the schema');
    const twice = fakeLlm([invalid(), invalid()]);
    const second = stage('invalid-twice', twice.llm, () => []);
    await expect(second.promise).rejects.toBeInstanceOf(ModelOutputInvalid);
    expect(twice.inputs).toHaveLength(2);
  });

  it('keeps the last document when a fix fails on its retry too, with what was pending as known', async () => {
    const invalid = () => new ModelOutputInvalid('output is not JSON: Unexpected token', []);
    const { llm, inputs } = fakeLlm([{ title: '' }, invalid(), invalid()]);
    const { run, promise } = stage('fix-refused', llm, requireTitle);
    const result = await promise;
    expect(result).toMatchObject({ output: { title: '' } });
    expect(result.known).toHaveLength(1);
    // The retry is no round of its own: both tries are round 2.
    expect(inputs.map((input) => input.round)).toEqual([1, 2, 2]);
    expect(readState(run).stages.doc?.status).not.toBe('failed');
    expect(
      readEvents(run).filter((event) => event.type === 'warning').at(-1)?.message,
    ).toContain('doc round 2: the fix failed');
  });

  it('retries a failed review once in its round; the other reviewer runs once, and a second failure adds no blockers', async () => {
    const calls: Record<string, number> = {};
    const reviewing = (failures: number): Llm => ({
      async generateStructured(input) {
        calls[input.stage] = (calls[input.stage] ?? 0) + 1;
        if (input.stage === 'doc-review-peer' && calls[input.stage]! <= failures)
          throw new Error('Meta API 500');
        const data = input.stage === 'doc' ? { title: 'Cats' } : clean;
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
    });
    const once = stage('review-retry', reviewing(1), () => [], guide);
    expect(await once.promise).toMatchObject({ output: { title: 'Cats' }, rounds: 1, known: [] });
    expect(calls).toEqual({ doc: 1, 'doc-review-peer': 2, 'doc-review-output': 1 });
    expect(readEvents(once.run).some((event) => event.type === 'warning' && String(event.message).includes('retrying once'))).toBe(true);

    for (const key of Object.keys(calls)) delete calls[key];
    const twice = stage('review-fails', reviewing(2), () => [], guide);
    expect(await twice.promise).toMatchObject({ output: { title: 'Cats' }, known: [] });
    expect(calls['doc-review-peer']).toBe(2);
    expect(
      readEvents(twice.run).some((event) => event.type === 'warning' && String(event.message).includes('the peer review failed')),
    ).toBe(true);
  });

  it('fails the stage when the retry is cut too, logging each cut call once', async () => {
    const { llm, inputs } = fakeLlm([cut(), cut()]);
    const { run, promise } = stage('cut-twice', llm, () => []);

    await expect(promise).rejects.toBeInstanceOf(ModelOutputTruncated);
    expect(inputs).toHaveLength(2);
    expect(readState(run).stages.doc).toMatchObject({
      status: 'failed',
      rounds: 1,
    });
    expect(
      readEvents(run).map((event) => [event.type, event.truncated]),
    ).toEqual([
      ['stage:start', undefined],
      ['round:start', undefined],
      ['llm:call', true],
      ['warning', undefined],
      ['llm:call', true],
      ['stage:failed', undefined],
    ]);
  });

  it('retries a cut fix with the same messages, pushed once', async () => {
    const { llm, inputs } = fakeLlm([{ title: '' }, cut(), { title: 'Cats' }]);
    const { run, promise } = stage('cut-fix', llm, requireTitle);

    expect(await promise).toMatchObject({
      output: { title: 'Cats' },
      rounds: 2,
    });
    expect(inputs.map((input) => input.round)).toEqual([1, 2, 2]);
    expect(inputs[2]).toEqual(inputs[1]);
    expect(inputs[2]?.messages.map((message) => message.role)).toEqual([
      'system',
      'user',
      'assistant',
      'user',
    ]);
    expect(
      readEvents(run).filter((event) => event.type === 'warning'),
    ).toMatchObject([
      {
        message:
          'doc round 2: the answer was cut at the output limit; retrying once',
      },
    ]);
  });
});

describe('runSpecStage with patch keys', () => {
  const Shelf = z.object({
    title: z.string(),
    books: z.array(z.object({ id: z.string(), name: z.string() })),
  });
  type Shelf = z.infer<typeof Shelf>;
  const draft: Shelf = {
    title: 'Shelf',
    books: [
      { id: 'B1', name: '' },
      { id: 'B2', name: 'Dune' },
    ],
  };
  const nameEveryBook = (shelf: Shelf): Issue[] =>
    shelf.books
      .filter((book) => !book.name)
      .map((book) => ({
        rule: 'DOC-003',
        severity: 'mandatory',
        message: 'a book needs a name',
        at: book.id,
      }));

  it('asks a fix for a patch, merges it, and validates and reviews the merged document', async () => {
    const patch = {
      title: null,
      books: { upsert: [{ id: 'B1', name: 'Emma' }], remove: [] },
    };
    const { llm, inputs } = fakeLlm([draft, clean, patch, clean] as never[]);
    const run = createRun({ idea, runsDir: root, id: 'patch-fix' });
    const result = await runSpecStage({
      run,
      stage: 'shelf',
      schema: Shelf,
      schemaName: 'Shelf',
      system: 'Write a shelf.',
      user: 'Two books.',
      validate: nameEveryBook,
      review: { output: guide.output },
      patchKeys: { books: 'id' },
      llm,
    });

    expect(result.output).toEqual({
      title: 'Shelf',
      books: [
        { id: 'B1', name: 'Emma' },
        { id: 'B2', name: 'Dune' },
      ],
    });
    expect(result.known).toEqual([]);
    expect(inputs.map((input) => input.schemaName)).toEqual([
      'Shelf',
      'Review',
      'ShelfPatch',
      'Review',
    ]);
    expect(lastUser(inputs[2])).toContain('Return a patch, not the complete document');
    expect(lastUser(inputs[2])).toContain('- T01: DOC-003 at B1: a book needs a name');
    expect(lastUser(inputs[3])).toContain('"name":"Emma"');
  });

  it('asks a stage without patch keys for the whole document', async () => {
    const { llm, inputs } = fakeLlm([{ title: '' }, { title: 'Cats' }]);
    const { promise } = stage('whole-fix', llm, requireTitle);
    await promise;
    expect(inputs[1]?.schemaName).toBe('Doc');
    expect(lastUser(inputs[1])).toContain('Return the complete corrected document as JSON');
  });
});

describe('runSpecStage with a guide whose points have ids', () => {
  const pointed: ReviewGuides = {
    output: '- O01: A title that says nothing.\n- O02: A title about dogs.\n- O03: A title in capitals.',
  };
  const lastRound: Partial<SpecStageOptions<Doc>> = {
    schedule: [
      { fix: false, reviewers: [] },
      { fix: true, reviewers: ['output'] },
    ],
  };

  it('asks once more for the points the reviewer left unchecked, keeps the blockers of both answers, and only logs what is still unchecked', async () => {
    const first: Review = { checked: ['O01'], blockers: [], replies: [] };
    const recheck: Review = { checked: ['O02'], blockers: generic.blockers, replies: [] };
    const { llm, inputs } = fakeLlm([{ title: 'Cats' }, first, recheck]);
    const { run, promise } = stage('recheck', llm, () => [], pointed, lastRound);
    const result = await promise;

    expect(inputs.map((input) => input.stage)).toEqual(['doc', 'doc-review-output', 'doc-review-output-recheck']);
    const messages = inputs[2]?.messages ?? [];
    expect(messages.slice(0, 2)).toEqual(inputs[1]?.messages);
    expect(messages[2]).toEqual({ role: 'assistant', content: JSON.stringify(first) });
    expect(messages[3]?.content).toContain('- O02\n- O03');
    expect(result.known).toEqual([genericIssue]);
    expect(
      readEvents(run)
        .filter((event) => event.type === 'llm:call' && event.reviewer)
        .map((event) => [event.reviewer, event.missed]),
    ).toEqual([
      ['output', ['O02', 'O03']],
      ['output-recheck', ['O03']],
    ]);
  });

  it('asks nothing more when every point was checked', async () => {
    const { llm, inputs } = fakeLlm([{ title: 'Cats' }, { checked: ['O01', 'O02', 'O03'], blockers: [], replies: [] }]);
    await stage('all-checked', llm, () => [], pointed, lastRound).promise;
    expect(inputs.map((input) => input.stage)).toEqual(['doc', 'doc-review-output']);
  });
});

describe('runSpecStage with reasoning threads', () => {
  const reason = 'Cats is the breed the user asked for.';
  const thread = `- T01: REVIEW at title: Title is generic. Fix: Name the breed.\n  - round 2, fix, open: ${reason}`;

  it("sends no check the fixer left with a reason to another fix, and keeps it known", async () => {
    const { llm, inputs } = fakeLlm([
      { title: '' },
      { title: '', replies: [{ id: 'T01', status: 'open', reason: 'The user gave no title.' }] } as Doc,
    ]);
    const { run, promise } = stage('check-left', llm, requireTitle);
    const result = await promise;

    expect(result).toMatchObject({ known: [missingTitle], rounds: 2 });
    expect(inputs).toHaveLength(2);
    // The replies go to the thread, not into the document.
    expect(result.output).toEqual({ title: '' });
    const threads = JSON.parse(readFileSync(path.join(run.dir, 'reports', 'doc.threads.json'), 'utf8'));
    expect(threads).toEqual([
      { id: 'T01', issue: missingTitle, by: 'checks', round: 1, entries: [{ id: 'T01', status: 'open', reason: 'The user gave no title.', round: 2, by: 'fix' }] },
    ]);
  });

  it("closes a thread its reviewer accepts, after showing the fixer's reason to that reviewer only", async () => {
    const accept: Review = { checked: [], blockers: [], replies: [{ id: 'T01', status: 'closed', reason: 'The reason holds.' }] };
    const { llm, inputs } = fakeLlm([
      { title: 'Cats' },
      generic,
      clean,
      { title: 'Cats', replies: [{ id: 'T01', status: 'open', reason }] } as Doc,
      accept,
      clean,
    ]);
    const { promise } = stage('thread-accepted', llm, () => [], guide);
    const result = await promise;

    expect(result).toMatchObject({ output: { title: 'Cats' }, known: [], rounds: 2 });
    expect(inputs.map((input) => input.stage)).toEqual([
      'doc',
      'doc-review-peer',
      'doc-review-output',
      'doc',
      'doc-review-peer',
      'doc-review-output',
    ]);
    expect(lastUser(inputs[3])).toContain('- T01: REVIEW at title: Title is generic. Fix: Name the breed.');
    // The peer raised T01, so only the peer gets it back.
    expect(lastUser(inputs[4])).toContain(thread);
    expect(lastUser(inputs[5])).toContain('## Your threads from the last round\n\nNone.');
  });

  it("keeps a reviewer's thread the next reviewer challenges, and sends it to the final fix with what both said", async () => {
    const challenge: Review = { checked: [], blockers: [], replies: [{ id: 'T01', status: 'open', reason: 'The user asked for Siamese.' }] };
    const { llm, inputs } = fakeLlm([
      { title: 'Cats' },
      generic,
      clean,
      { title: 'Cats', replies: [{ id: 'T01', status: 'open', reason }] } as Doc,
      challenge,
      clean,
      { title: 'Siamese cats', replies: [{ id: 'T01', status: 'closed', reason: 'Named the breed.' }] } as Doc,
    ]);
    const { promise } = stage('thread-challenged', llm, () => [], guide);
    const result = await promise;

    expect(result).toMatchObject({ output: { title: 'Siamese cats' }, rounds: 3 });
    expect(result.known).toEqual([{ ...genericIssue, message: `${genericIssue.message} (addressed in the final fix, not re-reviewed)` }]);
    expect(lastUser(inputs[6])).toContain(`${thread}\n  - round 2, review-peer, open: The user asked for Siamese.`);
  });
});
