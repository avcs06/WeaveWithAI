import { z } from 'zod';
import { type Issue, splitIssues } from '../core/issues';
import type { ImageInput, ModelChoice, ReasoningEffort } from '../core/llm';
import { fillPrompt, loadPrompt } from '../core/prompt';
import { appendEvent, runPath, updateStage } from '../core/run';
import { pathBeside, writeJsonAtomic } from '../core/utils';
import {
  type Call,
  callerFor,
  type Draft,
  failStage,
  runSpecStage,
  type SpecStageOptions,
  type SpecStageResult,
} from './runSpecStage';

export const Direction = z.object({
  id: z.string().describe('D1, D2 and on'),
  title: z.string().describe('A few words that name the concept'),
  concept: z.string().describe('What the document does under this direction and how that differs from the others, in two to four sentences'),
});
export type Direction = z.infer<typeof Direction>;

/** The model and effort of one creative step. */
export type StepSettings = { model?: ModelChoice; reasoningEffort?: ReasoningEffort };

export type CreativeOptions<T> = Omit<SpecStageOptions<T>, 'start' | 'resume' | 'started'> & {
  /** How many directions, one candidate each; default 3. */
  candidates?: number;
  /** One is picked with the seed and given to the diverge call, so runs do not all start from the same place. */
  randomConstraints?: string[];
  /** Seeds the constraint's pick and the judge's order; omitted, a random seed, logged with the directions. */
  seed?: number;
  /** Produces one candidate, such as by an external generator; every call it makes is named `<stage>-candidate-<n>`. */
  candidate?: (call: Call, direction: Direction) => Promise<Draft<T>>;
  /** What the judge looks at for one candidate, such as its render. */
  judgeImages?: (draft: Draft<T>) => ImageInput[];
  /** Defaults: diverge on the default model at medium; candidate on draftModel at reasoningEffort; judge on the candidate's model at high. */
  steps?: { diverge?: StepSettings; candidate?: StepSettings; judge?: StepSettings };
};

export type CreativeResult<T> = SpecStageResult<T> & {
  directions: Direction[];
  /** The direction of the candidate that won. */
  winner: Direction;
  /** The judge's reason, or why no judge ran. */
  reason: string;
};

type Candidate<T> = { n: number; direction: Direction; draft: Draft<T>; issues: Issue[] };
type Dropped = { n: number; direction: Direction; error: string };

const CANDIDATES = 3;
// The creative steps make round 1's document, so their calls are logged as round 1.
const ROUND = 1;
const STEP_MAX_TOKENS = 16_384;

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));
const divergePrompt = load('./prompt-diverge.md');
const divergeInput = load('./prompt-diverge-input.md');
const directionPrompt = load('./prompt-direction.md');
const judgePrompt = load('./prompt-judge.md');
const judgeInput = load('./prompt-judge-input.md');
const judgeCandidate = load('./prompt-judge-candidate.md');

/** mulberry32: a small seeded generator, so one seed replays the same pick and order. */
const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};

const shuffle = <U>(list: U[], random: () => number): U[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as U, out[i] as U];
  }
  return out;
};

/** The stage's user message with a direction under it; a candidate's writer, the reviewers and the fixer read the same text. */
export const withDirection = (user: string, direction: Direction): string =>
  `${user}\n\n${fillPrompt(directionPrompt, { title: direction.title, concept: direction.concept })}`;

/** A call that names every request `stage` and runs it with `step`'s model and effort unless the request sets its own. */
const stepCall = (call: Call, stage: string, step: StepSettings): Call => (input) =>
  call({ model: step.model, reasoningEffort: step.reasoningEffort, ...input, stage });

const diverge = async <T>(o: CreativeOptions<T>, call: Call, count: number, constraint: string | undefined, step: StepSettings) => {
  const result = await call({
    stage: `${o.stage}-diverge`,
    // A count in the JSON schema is refused by structured outputs; zod checks it on the answer, and a miss is retried.
    schema: z.object({ directions: z.array(Direction).refine((list) => list.length === count, `exactly ${count} directions`) }),
    schemaName: 'Directions',
    messages: [
      { role: 'system', content: fillPrompt(divergePrompt, { count: String(count) }) },
      { role: 'user', content: fillPrompt(divergeInput, { task: o.system, input: o.user, constraint: constraint ?? 'None.' }) },
    ],
    maxTokens: STEP_MAX_TOKENS,
    model: step.model ?? 'default',
    reasoningEffort: step.reasoningEffort ?? 'medium',
  });
  return result.data.directions;
};

/** The default candidate: one call with the stage's system, and its user message with the direction under it. */
const writeCandidate = async <T>(o: CreativeOptions<T>, call: Call, direction: Direction): Promise<Draft<T>> => {
  const result = await call({
    stage: o.stage,
    schema: o.schema,
    schemaName: o.schemaName,
    messages: [
      { role: 'system', content: o.system },
      { role: 'user', content: withDirection(o.user, direction) },
    ],
    maxTokens: o.maxTokens,
  });
  return { data: result.data, raw: result.raw, model: result.model };
};

/** One candidate per direction, side by side; a candidate whose call fails after its retry is dropped, never one with issues. */
const produceCandidates = async <T>(o: CreativeOptions<T>, call: Call, directions: Direction[], step: StepSettings) => {
  const settled = await Promise.allSettled(
    directions.map(async (direction, i): Promise<Candidate<T>> => {
      const n = i + 1;
      const named = stepCall(call, `${o.stage}-candidate-${n}`, step);
      const draft = await (o.candidate ? o.candidate(named, direction) : writeCandidate(o, named, direction));
      const issues = o.validate(draft.data);
      const { mandatory, warnings } = splitIssues(issues);
      appendEvent(o.run, {
        type: 'creative:validated',
        stage: o.stage,
        candidate: n,
        direction: direction.id,
        mandatory: mandatory.length,
        warnings: warnings.length,
        rules: mandatory.map((issue) => issue.rule),
      });
      return { n, direction, draft, issues };
    }),
  );

  const kept: Candidate<T>[] = [];
  const dropped: Dropped[] = [];
  settled.forEach((outcome, i) => {
    if (outcome.status === 'fulfilled') return void kept.push(outcome.value);
    const n = i + 1;
    const error = String(outcome.reason).split('\n')[0] ?? '';
    dropped.push({ n, direction: directions[i] as Direction, error });
    appendEvent(o.run, { type: 'warning', stage: o.stage, message: `${o.stage}: candidate ${n} failed (${error}); it is dropped` });
  });
  return { kept, dropped };
};

/**
 * The judge sees the task, the input and the candidates in shuffled order under letters, never their directions.
 * With one candidate left no judge runs; a judge that fails leaves the first candidate as the winner.
 */
const judge = async <T>(o: CreativeOptions<T>, call: Call, kept: Candidate<T>[], random: () => number, step: StepSettings) => {
  const first = kept[0] as Candidate<T>;
  if (kept.length === 1) return { winner: first, reason: 'The only candidate left; no judge ran.', order: [] as string[] };

  const order = shuffle(kept, random);
  const labels = order.map((_, i) => String.fromCharCode(65 + i));
  const candidates = order
    .map((candidate, i) => fillPrompt(judgeCandidate, { label: labels[i] ?? '', output: candidate.draft.raw }))
    .join('\n\n');
  const images = order.flatMap((candidate, i) =>
    (o.judgeImages?.(candidate.draft) ?? []).map((image) => ({ label: `${labels[i]}: ${image.label}`, file: image.file })),
  );
  const byLabel = labels.map((label, i) => `${label}=${order[i]?.n}`);

  try {
    const result = await call({
      stage: `${o.stage}-judge`,
      schema: z.object({
        winner: z.enum(labels as [string, ...string[]]).describe('The letter of the best candidate'),
        reason: z.string().describe('Why it beats the others, in one to three sentences'),
      }),
      schemaName: 'Verdict',
      messages: [
        { role: 'system', content: judgePrompt },
        {
          role: 'user',
          content: fillPrompt(judgeInput, { task: o.system, input: o.user, candidates }),
          ...(images.length > 0 && { images }),
        },
      ],
      maxTokens: STEP_MAX_TOKENS,
      model: step.model,
      reasoningEffort: step.reasoningEffort ?? 'high',
    });
    const winner = order[labels.indexOf(result.data.winner)] ?? first;
    return { winner, reason: result.data.reason, order: byLabel };
  } catch (error) {
    const why = String(error).split('\n')[0];
    appendEvent(o.run, { type: 'warning', stage: o.stage, message: `${o.stage}: the judge failed (${why}); candidate ${first.n} wins` });
    return { winner: first, reason: `The judge failed (${why}); the first candidate left won.`, order: byLabel };
  }
};

/**
 * A stage that tries several concepts before it settles: diverge into directions, write one candidate per
 * direction, let a judge pick one blind, then run the usual rounds on the winner with its direction kept.
 */
export const creativeRunner = async <T>(o: CreativeOptions<T>): Promise<CreativeResult<T>> => {
  const { candidates, randomConstraints, seed: givenSeed, candidate, judgeImages, steps = {}, ...spec } = o;
  const count = candidates ?? CANDIDATES;
  const seed = givenSeed ?? Math.floor(Math.random() * 2 ** 32);
  const random = seeded(seed);
  const constraint = randomConstraints?.length ? randomConstraints[Math.floor(random() * randomConstraints.length)] : undefined;
  const candidateStep = {
    model: steps.candidate?.model ?? o.draftModel,
    reasoningEffort: steps.candidate?.reasoningEffort ?? o.reasoningEffort,
  };
  const judgeStep = { model: steps.judge?.model ?? candidateStep.model, reasoningEffort: steps.judge?.reasoningEffort };
  const call = callerFor(spec, ROUND);

  appendEvent(o.run, { type: 'stage:start', stage: o.stage });
  updateStage(o.run, o.stage, { status: 'running' });
  const fail = (error: unknown): never => {
    failStage(o.run, o.stage, ROUND, error);
    throw error;
  };

  const directions = await diverge(o, call, count, constraint, steps.diverge ?? {}).catch(fail);
  appendEvent(o.run, {
    type: 'creative:directions',
    stage: o.stage,
    seed,
    constraint,
    titles: directions.map((direction) => direction.title),
  });

  const { kept, dropped } = await produceCandidates(o, call, directions, candidateStep);
  if (kept.length === 0) fail(new Error(`${o.stage}: all ${count} candidates failed; the first: ${dropped[0]?.error}`));

  const verdict = await judge(o, call, kept, random, judgeStep);
  const { winner } = verdict;
  appendEvent(o.run, { type: 'creative:judged', stage: o.stage, candidate: winner.n, direction: winner.direction.id, reason: verdict.reason });
  writeJsonAtomic(runPath(o.run, 'reports', `${o.stage}.creative.json`), {
    seed,
    constraint,
    directions,
    judge: { order: verdict.order, winner: winner.n, reason: verdict.reason },
    losers: kept
      .filter((candidate) => candidate !== winner)
      .map(({ n, direction, draft, issues }) => ({ n, direction: direction.id, model: draft.model, issues, data: draft.data })),
    dropped: dropped.map(({ n, direction, error }) => ({ n, direction: direction.id, error })),
  });

  const result = await runSpecStage({
    ...spec,
    user: withDirection(o.user, winner.direction),
    start: winner.draft,
    started: true,
  });
  return { ...result, directions, winner: winner.direction, reason: verdict.reason };
};
