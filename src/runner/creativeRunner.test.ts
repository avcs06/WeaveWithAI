import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type Anthropic from '@anthropic-ai/sdk';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { Config } from '../core/env';
import type { Issue } from '../core/issues';
import { createLlm, type GenerateInput, type Llm, type MessagesClient } from '../core/llm';
import { createRun, readEvents, readState, runPath } from '../core/run';
import { type CreativeOptions, creativeRunner, type Direction, withDirection } from './creativeRunner';
import type { Review } from './review';

const root = mkdtempSync(path.join(tmpdir(), 'weave-creative-'));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '# Idea\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const Doc = z.object({ title: z.string() });
type Doc = z.infer<typeof Doc>;

const directions: Direction[] = [
  { id: 'dir-moss', title: 'Mossy archive', concept: 'Cats as a quiet library of old breeds.' },
  { id: 'dir-neon', title: 'Neon arcade', concept: 'Cats as loud characters in a game.' },
  { id: 'dir-ink', title: 'Ink broadsheet', concept: 'Cats as front page news.' },
];
const clean: Review = { checked: [], blockers: [], replies: [] };
const notFixed: Issue = { rule: 'DOC-001', severity: 'mandatory', message: 'title must say fixed', at: 'title' };

type Answer = unknown | Error;

/** An llm that answers by stage, parses with the request's schema like the real client, and keeps every input. */
const fakeLlm = (answer: (input: GenerateInput<unknown>) => Answer) => {
  const inputs: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      inputs.push({ ...input, messages: [...input.messages] } as GenerateInput<unknown>);
      const data = answer(input as GenerateInput<unknown>);
      if (data instanceof Error) throw data;
      return {
        data: input.schema.parse(data),
        raw: JSON.stringify(data),
        usage: { input: 10, cachedInput: 0, output: 5 },
        costUsd: 0.001,
        replayed: false,
        model: 'claude-sonnet-5-5',
        durationMs: 1,
      };
    },
  };
  return { llm, inputs };
};

/** Directions, `Candidate <n>` per candidate, A from the judge, clean reviews and a fixed title from a fix. */
const answers =
  (failing: number[] = []) =>
  (input: GenerateInput<unknown>): Answer => {
    const candidate = /-candidate-(\d+)$/.exec(input.stage)?.[1];
    if (candidate) return failing.includes(Number(candidate)) ? new Error('overloaded') : { title: `Candidate ${candidate}` };
    if (input.stage === 'doc-diverge') return { directions };
    if (input.stage === 'doc-judge') return { winner: 'A', reason: 'A is the boldest.' };
    if (input.stage === 'doc-review-output') return clean;
    if (input.stage === 'doc') return { title: 'fixed', replies: [] };
    return new Error(`no answer for ${input.stage}`);
  };

const creative = (id: string, llm: Llm, extra: Partial<CreativeOptions<Doc>> = {}) => {
  const run = createRun({ idea, runsDir: root, id });
  const promise = creativeRunner({
    run,
    llm,
    stage: 'doc',
    schema: Doc,
    schemaName: 'Doc',
    system: 'Write a doc.',
    user: 'About cats.',
    validate: () => [],
    seed: 1,
    ...extra,
  });
  return { run, promise };
};

const userOf = (input: GenerateInput<unknown> | undefined) => input?.messages.at(-1)?.content ?? '';
const byStage = (inputs: GenerateInput<unknown>[], stage: string) => inputs.filter((input) => input.stage === stage);
/** The candidate the judge saw first, under A, which the fake judge picks. */
const shownAsA = (inputs: GenerateInput<unknown>[]) =>
  JSON.parse(/### Candidate A\n\n````\n(.*)\n````/.exec(userOf(byStage(inputs, 'doc-judge')[0]))?.[1] ?? 'null') as Doc;

describe('creativeRunner', () => {
  it('diverges, writes a candidate per direction, judges them and returns the winner with its direction', async () => {
    const { llm, inputs } = fakeLlm(answers());
    const { run, promise } = creative('all-succeed', llm);
    const result = await promise;

    expect(inputs.map((input) => input.stage).sort()).toEqual([
      'doc-candidate-1',
      'doc-candidate-2',
      'doc-candidate-3',
      'doc-diverge',
      'doc-judge',
    ]);
    for (const [i, direction] of directions.entries())
      expect(userOf(byStage(inputs, `doc-candidate-${i + 1}`)[0])).toBe(withDirection('About cats.', direction));

    const winner = shownAsA(inputs);
    expect(result.output).toEqual(winner);
    expect(result.winner).toEqual(directions[Number(winner.title.split(' ')[1]) - 1]);
    expect(result.reason).toBe('A is the boldest.');
    expect(result.directions).toEqual(directions);

    const events = readEvents(run);
    expect(events.filter((event) => event.type === 'stage:start')).toHaveLength(1);
    expect(events.filter((event) => event.type === 'creative:validated')).toHaveLength(3);
    expect(events.map((event) => event.type)).toContain('creative:judged');
    expect(readState(run).stages.doc?.status).toBe('running');

    const record = JSON.parse(readFileSync(runPath(run, 'reports', 'doc.creative.json'), 'utf8'));
    expect(record.losers).toHaveLength(2);
    expect(record.losers.map((loser: { data: Doc }) => loser.data)).not.toContainEqual(winner);
    expect(record.judge.reason).toBe('A is the boldest.');
  });

  it('drops a candidate whose call fails after its retry and judges the rest', async () => {
    const { llm, inputs } = fakeLlm(answers([2]));
    const { run, promise } = creative('one-fails', llm);
    const result = await promise;

    expect(byStage(inputs, 'doc-candidate-2')).toHaveLength(2);
    const judged = userOf(byStage(inputs, 'doc-judge')[0]);
    expect(judged).toContain('### Candidate B');
    expect(judged).not.toContain('### Candidate C');
    expect(judged).not.toContain('Candidate 2"');
    expect(result.output.title).not.toBe('Candidate 2');
    expect(readEvents(run).some((event) => event.type === 'warning' && String(event.message).includes('candidate 2 failed'))).toBe(true);
    const record = JSON.parse(readFileSync(runPath(run, 'reports', 'doc.creative.json'), 'utf8'));
    expect(record.dropped).toEqual([{ n: 2, direction: 'dir-neon', error: 'Error: overloaded' }]);
  });

  it('fails the stage when every candidate fails', async () => {
    const { llm, inputs } = fakeLlm(answers([1, 2, 3]));
    const { run, promise } = creative('all-fail', llm);

    await expect(promise).rejects.toThrow('all 3 candidates failed');
    expect(byStage(inputs, 'doc-judge')).toHaveLength(0);
    expect(readState(run).stages.doc?.status).toBe('failed');
    expect(readEvents(run).filter((event) => event.type === 'stage:failed')).toHaveLength(1);
  });

  it('never shows the judge a direction title, concept or id', async () => {
    const { llm, inputs } = fakeLlm(answers());
    await creative('blind-judge', llm).promise;

    const request = JSON.stringify(byStage(inputs, 'doc-judge')[0]?.messages);
    for (const direction of directions)
      for (const text of [direction.id, direction.title, direction.concept]) expect(request).not.toContain(text);
  });

  it('starts runSpecStage from the winner with no first-draft call', async () => {
    const { llm, inputs } = fakeLlm(answers());
    const { run, promise } = creative('starts-from-winner', llm);
    await promise;

    expect(byStage(inputs, 'doc')).toHaveLength(0);
    const events = readEvents(run);
    expect(events.filter((event) => event.type === 'round:start')).toHaveLength(0);
    expect(events.find((event) => event.type === 'stage:round')).toMatchObject({ round: 1, generated: false });
  });

  it('gives runSpecStage the user message with the winning direction, so the reviewers and the fixer keep it', async () => {
    const { llm, inputs } = fakeLlm(answers());
    const { promise } = creative('keeps-direction', llm, {
      validate: (doc) => (doc.title === 'fixed' ? [] : [notFixed]),
      review: { output: 'Look for: a title that says nothing.' },
    });
    const result = await promise;
    const user = withDirection('About cats.', result.winner);

    const review = userOf(byStage(inputs, 'doc-review-output')[0]);
    expect(review).toContain(user);
    for (const other of directions.filter((direction) => direction.id !== result.winner.id)) expect(review).not.toContain(other.concept);
    expect(byStage(inputs, 'doc')[0]?.messages[1]?.content).toBe(user);
    expect(result.output).toEqual({ title: 'fixed' });
  });

  it('picks the same random constraint for the same seed', async () => {
    const randomConstraints = ['Start from print.', 'Start from games.', 'Start from maps.', 'Start from music.', 'Start from food.'];
    const constraintOf = async (id: string, seed: number) => {
      const { llm, inputs } = fakeLlm(answers());
      await creative(id, llm, { seed, randomConstraints }).promise;
      return randomConstraints.find((constraint) => userOf(byStage(inputs, 'doc-diverge')[0]).includes(constraint));
    };

    const first = await constraintOf('seed-a', 7);
    expect(first).toBeDefined();
    expect(await constraintOf('seed-b', 7)).toBe(first);
    const picks = new Set(await Promise.all([1, 2, 3, 4, 5, 6, 8, 9].map((seed) => constraintOf(`seed-${seed}`, seed))));
    expect(picks.size).toBeGreaterThan(1);
  });

  it('sends no temperature, top_p, top_k or thinking budget in any request', async () => {
    const config: Config = {
      ANTHROPIC_API_KEY: 'test-key',
      LLM_MODEL: 'claude-sonnet-5-5',
      LLM_MODEL_STRONG: 'claude-opus-5-5',
      LLM_REPLAY: false,
      CLAUDE_BIN: 'claude',
      CLAUDE_DOCKER: false,
      CLAUDE_AUTH: 'api',
    };
    const bodies: Parameters<MessagesClient['create']>[0][] = [];
    const client: MessagesClient = {
      async create(body) {
        bodies.push(body);
        const system = String(body.system);
        const text = system.includes('Propose 3 directions')
          ? { directions }
          : system.includes('Pick the best')
            ? { winner: 'A', reason: 'A is the boldest.' }
            : { title: 'Cats' };
        return {
          model: body.model,
          content: [{ type: 'text', text: JSON.stringify(text), citations: null }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        } as unknown as Anthropic.Beta.Messages.BetaMessage;
      },
    };
    const llm = createLlm({ config, client, replayDir: path.join(root, 'replay') });
    await creative('wire', llm, { reasoningEffort: 'high' }).promise;

    expect(bodies).toHaveLength(5);
    for (const body of bodies) {
      expect(body).not.toHaveProperty('temperature');
      expect(body).not.toHaveProperty('top_p');
      expect(body).not.toHaveProperty('top_k');
      expect(body).not.toHaveProperty('thinking');
    }
  });
});
