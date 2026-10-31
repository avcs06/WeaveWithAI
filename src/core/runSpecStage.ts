import type { z } from 'zod';
import {
  clearReport,
  formatIssues,
  type Issue,
  splitIssues,
  writeReport,
} from './issues';
import {
  type ChatMessage,
  type GenerateInput,
  type GenerateResult,
  type Llm,
  type ModelChoice,
  ModelOutputTruncated,
  type ReasoningEffort,
  type Temperature,
} from './llm';
import { costUsd, isPriced } from './prices';
import { fillPrompt, loadPrompt } from './prompt';
import { Review, toIssues } from './review';
import { appendEvent, type Run, updateStage } from './run';
import { pathBeside } from './utils';

/** Question id to the question as asked and the answer given; the question text survives reruns, the id alone does not. */
export type Answer = { question: string; answer: string };
export type Answers = Record<string, Answer>;

/** A stage's review guides (D1.12): the peer challenges the decisions, the output reviewer finds what the validators cannot. Without a peer guide only the output reviewer runs. */
export type ReviewGuides = { peer?: string; output: string };

/** What a stage produces in a round: the typed document, the text the reviewers read, and which model wrote it. */
export type Draft<T> = { data: T; raw: string; model: string };

/** One model call made for the stage; it is logged as an `llm:call` event and runs on the default model unless it names one. */
export type Call = <U>(
  input: Omit<GenerateInput<U>, 'round' | 'runDir' | 'model'> & {
    model?: GenerateInput<U>['model'];
  },
) => Promise<GenerateResult<U>>;

/** How a stage produces its document: the first draft, and a fix that applies pending issues and answers to the current one. */
export type Compose<T> = {
  draft(call: Call): Promise<Draft<T>>;
  fix(
    call: Call,
    current: Draft<T>,
    pending: Issue[],
    answers: Answers,
  ): Promise<Draft<T>>;
};

export type SpecStageOptions<T> = {
  run: Run;
  stage: string;
  schema: z.ZodType<T>;
  schemaName: string;
  /** The filled system prompt; the reviewers see it as the instructions the writer had. */
  system: string;
  /** The user message of the writer's first call; the reviewers see it as the input the writer had. */
  user: string;
  validate: (output: T) => Issue[];
  /** The stage's review guides. Without them no reviewer calls run. */
  review?: ReviewGuides;
  /** Interactive stages only: asked after every round that produced new output. Answers never force a generation. */
  ask?: (output: T) => Promise<Answers>;
  /** Output budget for the writer's calls, reasoning included (D1.13); the client doubles it once when the answer is cut. */
  maxTokens?: number;
  /** Reasoning effort for the first draft, and medium for every fix; omitted, the model picks its own level for both. */
  reasoningEffort?: ReasoningEffort;
  /** Temperature for the first draft; default 0.2. Fixes and reviewers always run at 0.2. */
  temperature?: Temperature;
  /** The model of the first draft only; fixes always use the default model. */
  draftModel?: ModelChoice;
  /** How the document is produced; the default is one conversation with the model. */
  compose?: Compose<T>;
  /** A document to start from: round 1 validates it instead of generating one (reconciliation). */
  start?: Draft<T>;
  /** Issues found outside the stage's own validators, such as on the whole design; they join round 1's issues of `start`, so its first fix applies them. */
  seed?: Issue[];
  llm: Llm;
};

export type SpecStageResult<T> = {
  output: T;
  warnings: Issue[];
  known: Issue[];
  /** Every answer given during the stage, applied or carried forward. */
  answers: Answers;
  /** The model that produced the output. */
  model: string;
  rounds: number;
};

// D1.12 (five rounds, user, 2026-10-30): a fix runs only when something is pending; from round 2 on reviewers look at the output whatever the validators found.
// The peer challenges the decisions once, in round 2; the output reviewer checks round 2 and the two fixes after it; round 5 is the final fix.
const SCHEDULE: { fix: boolean; reviewers: (keyof ReviewGuides)[] }[] = [
  { fix: false, reviewers: [] },
  { fix: true, reviewers: ['peer', 'output'] },
  { fix: true, reviewers: ['output'] },
  { fix: true, reviewers: ['output'] },
  { fix: true, reviewers: [] },
];
const FIX_EFFORT = 'medium';
// Reviewers return a short list, so their tokens are mostly reasoning; medium keeps it considered but bounded (D1.13).
const REVIEW_EFFORT = 'medium';
const REVIEW_MAX_TOKENS = 8192;
const NOT_REREVIEWED = ' (addressed in the final fix, not re-reviewed)';

const fixPrompt = loadPrompt(pathBeside(import.meta.url, './prompt-fix.md'));
const reviewPrompt = loadPrompt(
  pathBeside(import.meta.url, './prompt-review.md'),
);
const reviewInput = loadPrompt(
  pathBeside(import.meta.url, './prompt-review-input.md'),
);

/**
 * Produce, validate, review on schedule, fix what is pending; whatever is left at the end is known, never fatal.
 * The document comes from `start`, or from `compose.draft`; every later generation is `compose.fix`.
 */
export async function runSpecStage<T>(
  o: SpecStageOptions<T>,
): Promise<SpecStageResult<T>> {
  appendEvent(o.run, { type: 'stage:start', stage: o.stage });
  updateStage(o.run, o.stage, { status: 'running' });
  clearReport(o.run, o.stage);

  const compose = o.compose ?? conversation(o);
  const answers: Answers = {};
  // Answers given since the last generation; they ride along with the next fix, never cause one.
  let unapplied: Answers = {};

  const produce = async (
    round: number,
    make: (call: Call) => Promise<Draft<T>>,
  ) => {
    const call = callerFor(o, round);
    try {
      const draft = await make(call);
      return { draft, issues: o.validate(draft.data) };
    } catch (error) {
      // A model error (truncation, bad status) ends the run; leave the state honest for `weave show`.
      updateStage(o.run, o.stage, {
        status: 'failed',
        rounds: round,
      });
      appendEvent(o.run, {
        type: 'stage:failed',
        stage: o.stage,
        round,
        error: String(error),
      });
      throw error;
    }
  };

  const askAbout = async (output: T) => {
    if (!o.ask) return;
    const given = await o.ask(output);
    const count = Object.keys(given).length;
    if (count === 0) return;
    Object.assign(answers, given);
    Object.assign(unapplied, given);
    appendEvent(o.run, { type: 'stage:answers', stage: o.stage, count });
  };

  let last = o.start
    ? {
        draft: o.start,
        issues: [...o.validate(o.start.data), ...(o.seed ?? [])],
      }
    : await produce(1, (call) => compose.draft(call));
  await askAbout(last.draft.data);

  let pending: Issue[] = [];
  let blockers: Issue[] = [];
  let rounds = 1;
  for (const [index, step] of SCHEDULE.entries()) {
    const round = index + 1;
    rounds = round;
    const hasPendingIssues = pending.length > 0;
    if (step.fix && hasPendingIssues) {
      const toApply = unapplied;
      unapplied = {};
      last = await produce(round, (call) =>
        compose.fix(call, last.draft, pending, toApply),
      );
      await askAbout(last.draft.data);
    }
    // Round 1 always produced (or started from a given document); later rounds only when something was pending.
    const produced = round === 1 ? !o.start : hasPendingIssues;

    const { mandatory, warnings } = splitIssues(last.issues);
    const reviewers = step.reviewers.filter((reviewer) => o.review?.[reviewer]);
    if (o.review && reviewers.length > 0) {
      blockers = await review(
        o,
        o.review,
        round,
        reviewers,
        last.draft.raw,
        warnings,
      );
    } else if (produced) {
      // The final fix addressed these; nobody checked the result.
      blockers = blockers.map((issue) => ({
        ...issue,
        message: issue.message + NOT_REREVIEWED,
      }));
    }

    pending = [...mandatory, ...blockers];
    writeReport(o.run, o.stage, round, [...last.issues, ...blockers]);
    appendEvent(o.run, {
      type: 'stage:round',
      stage: o.stage,
      round,
      generated: produced,
      mandatory: mandatory.length,
      warnings: warnings.length,
      blockers: blockers.length,
    });
    if (pending.length === 0 && (reviewers.length > 0 || !o.review)) break;
  }

  const { warnings } = splitIssues(last.issues);
  appendEvent(o.run, {
    type: 'stage:done',
    stage: o.stage,
    rounds,
    known: pending.length,
  });
  updateStage(o.run, o.stage, { rounds, known: pending.length });

  return {
    output: last.draft.data,
    warnings,
    known: pending,
    answers,
    model: last.draft.model,
    rounds,
  };
}

/** The default way to produce a document: one conversation, the fix message appended after each round. */
function conversation<T>(o: SpecStageOptions<T>): Compose<T> {
  const messages: ChatMessage[] = [
    { role: 'system', content: o.system },
    { role: 'user', content: o.user },
  ];
  const generate = async (
    call: Call,
    settings: Pick<
      GenerateInput<T>,
      'model' | 'reasoningEffort' | 'temperature'
    >,
  ): Promise<Draft<T>> => {
    const result = await call({
      stage: o.stage,
      schema: o.schema,
      schemaName: o.schemaName,
      messages,
      maxTokens: o.maxTokens,
      ...settings,
    });
    return { data: result.data, raw: result.raw, model: result.model };
  };
  return {
    draft: (call) =>
      generate(call, {
        model: o.draftModel,
        reasoningEffort: o.reasoningEffort,
        temperature: o.temperature,
      }),
    // A fix edits the named issues and nothing else, so it runs at the default 0.2, and at medium when the stage sets an effort (user, 2026-10-30).
    fix(call, current, pending, answers) {
      messages.push(
        { role: 'assistant', content: current.raw },
        { role: 'user', content: fixMessage(pending, answers) },
      );
      return generate(call, {
        reasoningEffort: o.reasoningEffort ? FIX_EFFORT : undefined,
      });
    },
  };
}

/** The fix message of D1.5 A: the pending issues and the answers given since the last generation. */
export function fixMessage(pending: Issue[], answers: Answers): string {
  return fillPrompt(fixPrompt, {
    issues: formatIssues(pending),
    answers: Object.keys(answers).length > 0 ? formatAnswers(answers) : 'None.',
  });
}

/**
 * A `Call` for one round: logs every call as an `llm:call` event.
 * A call cut at the output limit is retried once here, not around the compose, so a compose's side effects never repeat.
 */
function callerFor<T>(o: SpecStageOptions<T>, round: number): Call {
  return async (input) => {
    const request = {
      ...input,
      round,
      model: input.model ?? 'default',
      runDir: o.run.dir,
    };
    for (let retried = false; ; retried = true) {
      try {
        const result = await o.llm.generateStructured(request);
        logCall(o.run, input.stage, round, result);
        return result;
      } catch (error) {
        if (!(error instanceof ModelOutputTruncated)) throw error;
        appendEvent(o.run, {
          type: 'llm:call',
          stage: input.stage,
          round,
          truncated: true,
          model: error.model,
          input: error.usage.input,
          cachedInput: error.usage.cachedInput,
          output: error.usage.output,
          costUsd: costUsd(error.model, error.usage),
          contentLength: error.contentLength,
        });
        warnUnpriced(o.run, input.stage, error.model);
        if (retried) throw error;
        appendEvent(o.run, {
          type: 'warning',
          stage: input.stage,
          message: `${input.stage} round ${round}: the answer was cut at the output limit; retrying once`,
        });
      }
    }
  };
}

async function review<T>(
  o: SpecStageOptions<T>,
  guides: ReviewGuides,
  round: number,
  reviewers: (keyof ReviewGuides)[],
  output: string,
  warnings: Issue[],
) {
  const known = warnings.length > 0 ? formatIssues(warnings) : 'None.';
  const user = fillPrompt(reviewInput, {
    system: o.system,
    user: o.user,
    output,
    known,
  });
  const reviews = await Promise.all(
    reviewers.map(async (reviewer) => {
      const stage = `${o.stage}-review-${reviewer}`;
      const system = fillPrompt(reviewPrompt, { guide: guides[reviewer] ?? '' });
      const result = await o.llm.generateStructured({
        stage,
        round,
        schema: Review,
        schemaName: 'Review',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        model: 'default',
        reasoningEffort: REVIEW_EFFORT,
        maxTokens: REVIEW_MAX_TOKENS,
        runDir: o.run.dir,
      });
      logCall(o.run, stage, round, result);
      return result.data;
    }),
  );
  return reviews.flatMap(toIssues);
}

/** One `- Q01 "question": answer` line per answer, the way answers go to the model. */
export function formatAnswers(answers: Answers): string {
  return Object.entries(answers)
    .map(([id, { question, answer }]) => `- ${id} "${question}": ${answer}`)
    .join('\n');
}

/** A live call to a model with no price costs 0 in the totals; say so. */
function warnUnpriced(run: Run, stage: string, model: string): void {
  if (isPriced(model)) return;
  appendEvent(run, {
    type: 'warning',
    stage,
    message: `${model} has no price in src/core/prices.ts; its calls count as $0`,
  });
}

function logCall(
  run: Run,
  stage: string,
  round: number,
  result: GenerateResult<unknown>,
): void {
  if (!result.replayed) warnUnpriced(run, stage, result.model);
  appendEvent(run, {
    type: 'llm:call',
    stage,
    round,
    backend: result.backend,
    model: result.model,
    input: result.usage.input,
    cachedInput: result.usage.cachedInput,
    output: result.usage.output,
    costUsd: result.costUsd,
    replayed: result.replayed,
    durationMs: result.durationMs,
  });
}
