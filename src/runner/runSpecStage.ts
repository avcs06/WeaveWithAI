import type { z } from 'zod';
import {
  clearReport,
  formatIssues,
  type Issue,
  splitIssues,
  writeReport,
} from '../core/issues';
import {
  type ChatMessage,
  type GenerateInput,
  type GenerateResult,
  type Llm,
  type ModelChoice,
  ModelOutputInvalid,
  ModelOutputTruncated,
  type ReasoningEffort,
  type Temperature,
} from '../core/llm';
import { costUsd, isPriced } from '../core/prices';
import { fillPrompt, loadPrompt } from '../core/prompt';
import { applyPatch, type PatchKeys, patchFormat, patchSchema } from './patch';
import { guideIds, Review, toIssues } from './review';
import { appendEvent, type Run, updateStage } from '../core/run';
import { pathBeside } from '../core/utils';

/** Question id to the question as asked and the answer given; the question text survives reruns, the id alone does not. */
export type Answer = { question: string; answer: string };
export type Answers = Record<string, Answer>;

/**
 * A stage's review guides: the peer challenges the decisions, the output reviewer finds what the validators cannot.
 * Without a peer guide only the output reviewer runs. Named output guides are several output reviewers, one call each (code units).
 */
export type ReviewGuides = { peer?: string; output: string | Record<string, string> };

/** One round of a schedule: whether it fixes what is pending, and which reviewers look after it. */
export type Round = { fix: boolean; reviewers: (keyof ReviewGuides)[] };

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
  /** The rounds; default the five of SCHEDULE. */
  schedule?: Round[];
  /** The reviewers' user message, with the placeholders system, user, output and known; default prompt-review-input.md. */
  reviewInput?: string;
  /** Reviewers see the mandatory issues as known, the ones the next fix takes, instead of the warnings. */
  reviewersSeeMandatory?: boolean;
  /** Interactive stages only: asked after every round that produced new output. Answers never force a generation. */
  ask?: (output: T) => Promise<Answers>;
  /** Output budget for the writer's calls, reasoning included; the client doubles it once when the answer is cut. */
  maxTokens?: number;
  /** Reasoning effort for the first draft, and medium for every fix; omitted, the model picks its own level for both. */
  reasoningEffort?: ReasoningEffort;
  /** Temperature for the first draft; default 0.2. Fixes and reviewers always run at 0.2. */
  temperature?: Temperature;
  /** The model of the first draft only; fixes always use the default model. */
  draftModel?: ModelChoice;
  /** How the document is produced; the default is one conversation with the model. */
  compose?: Compose<T>;
  /** A document to start from: round 1 validates it instead of generating one, and the fixes patch it. */
  start?: Draft<T>;
  /** The document's keyed lists. With them a fix of the default conversation returns a patch the runner merges; without them, the whole document. */
  patchKeys?: PatchKeys;
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

// Five rounds: a fix runs only when something is pending; from round 2 on reviewers look at the output whatever the validators found.
// The peer challenges the decisions once, in round 2; the output reviewer checks round 2 and the two fixes after it; round 5 is the final fix.
const SCHEDULE: Round[] = [
  { fix: false, reviewers: [] },
  { fix: true, reviewers: ['peer', 'output'] },
  { fix: true, reviewers: ['output'] },
  { fix: true, reviewers: ['output'] },
  { fix: true, reviewers: [] },
];
const FIX_EFFORT = 'medium';
// Reviewers walk every guide point and look past the guide, so their tokens are mostly reasoning; medium keeps it considered but bounded.
const REVIEW_EFFORT = 'medium';
const REVIEW_MAX_TOKENS = 16_384;
const NOT_REREVIEWED = ' (addressed in the final fix, not re-reviewed)';

const fixPrompt = loadPrompt(
  pathBeside(import.meta.url, './prompt-fix-whole.md'),
);
const patchFixPrompt = loadPrompt(
  pathBeside(import.meta.url, './prompt-fix.md'),
);
const reviewPrompt = loadPrompt(
  pathBeside(import.meta.url, './prompt-review.md'),
);
const reviewInput = loadPrompt(
  pathBeside(import.meta.url, './prompt-review-input.md'),
);
const recheckPrompt = loadPrompt(
  pathBeside(import.meta.url, './prompt-review-recheck.md'),
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
    fixing: number,
    fatal = true,
  ) => {
    const call = callerFor(o, round);
    appendEvent(o.run, { type: 'round:start', stage: o.stage, round, fixing });
    try {
      const draft = await make(call);
      return { draft, issues: o.validate(draft.data) };
    } catch (error) {
      if (!fatal) throw error;
      // A model error on the first draft ends the run; leave the state honest for `weave show`.
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
    ? { draft: o.start, issues: o.validate(o.start.data) }
    : await produce(1, (call) => compose.draft(call), 0);
  await askAbout(last.draft.data);

  let pending: Issue[] = [];
  let blockers: Issue[] = [];
  let rounds = 1;
  for (const [index, step] of (o.schedule ?? SCHEDULE).entries()) {
    const round = index + 1;
    rounds = round;
    const hasPendingIssues = pending.length > 0;
    if (step.fix && hasPendingIssues) {
      const toApply = unapplied;
      unapplied = {};
      try {
        last = await produce(
          round,
          (call) => compose.fix(call, last.draft, pending, toApply),
          pending.length,
          false,
        );
      } catch (error) {
        // A fix the model cannot answer keeps the last document; what was pending stays as known issues and the run goes on.
        appendEvent(o.run, {
          type: 'warning',
          stage: o.stage,
          message: `${o.stage} round ${round}: the fix failed (${String(error).split('\n')[0]}); the stage keeps the document of round ${round - 1}`,
        });
        break;
      }
      await askAbout(last.draft.data);
    }
    // Round 1 produced unless it started from a given document; later rounds only when something was pending.
    const produced = round === 1 ? !o.start : hasPendingIssues;

    const { mandatory, warnings } = splitIssues(last.issues);
    if (round === 1 || produced)
      appendEvent(o.run, {
        type: 'round:validated',
        stage: o.stage,
        round,
        mandatory: mandatory.length,
        warnings: warnings.length,
        rules: mandatory.map((issue) => issue.rule),
      });
    const reviewers = step.reviewers.filter((reviewer) => o.review?.[reviewer]);
    if (o.review && reviewers.length > 0) {
      blockers = await review(
        o,
        o.review,
        round,
        reviewers,
        last.draft.raw,
        o.reviewersSeeMandatory ? mandatory : warnings,
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
    // A fix edits the named issues and nothing else, so it runs at the default 0.2, and at medium when the stage sets an effort.
    async fix(call, current, pending, answers) {
      const reasoningEffort = o.reasoningEffort ? FIX_EFFORT : undefined;
      const keys = o.patchKeys;
      messages.push(
        { role: 'assistant', content: current.raw },
        {
          role: 'user',
          content: keys
            ? patchFixMessage(pending, answers)
            : fixMessage(pending, answers),
        },
      );
      if (!keys) return generate(call, { reasoningEffort });
      const result = await call({
        stage: o.stage,
        schema: patchSchema(o.schema, keys),
        schemaName: `${o.schemaName}Patch`,
        messages,
        maxTokens: o.maxTokens,
        reasoningEffort,
      });
      const data = o.schema.parse(
        applyPatch(current.data as object, result.data, keys),
      );
      return { data, raw: JSON.stringify(data), model: result.model };
    },
  };
}

/** The fix message for a document with no keyed lists: the pending issues and the answers given since the last generation. */
export function fixMessage(pending: Issue[], answers: Answers): string {
  return fillPrompt(fixPrompt, {
    issues: formatIssues(pending),
    answers: Object.keys(answers).length > 0 ? formatAnswers(answers) : 'None.',
  });
}

/** The fix message for a document with keyed lists: the same, asking for a patch. */
function patchFixMessage(pending: Issue[], answers: Answers): string {
  return fillPrompt(patchFixPrompt, {
    patch: patchFormat,
    issues: formatIssues(pending),
    answers: Object.keys(answers).length > 0 ? formatAnswers(answers) : 'None.',
  });
}

/** Tries per model call before a bad or cut answer counts as the model's failure. */
const CALL_ATTEMPTS = 3;

/**
 * A `Call` for one round: logs every call as an `llm:call` event.
 * A call cut at the output limit, or answered with what the schema refuses, is
 * tried up to CALL_ATTEMPTS times here, not around the compose, so a compose's side effects never repeat.
 */
function callerFor<T>(o: SpecStageOptions<T>, round: number): Call {
  return async (input) => {
    const request = {
      ...input,
      round,
      model: input.model ?? 'default',
      runDir: o.run.dir,
    };
    for (let attempt = 1; ; attempt += 1) {
      const retried = attempt >= CALL_ATTEMPTS;
      try {
        const result = await o.llm.generateStructured(request);
        logCall(o.run, input.stage, round, result);
        return result;
      } catch (error) {
        if (error instanceof ModelOutputInvalid) {
          const paid = error.paid;
          if (paid) {
            appendEvent(o.run, {
              type: 'llm:call',
              stage: input.stage,
              round,
              invalid: true,
              model: paid.model,
              input: paid.usage.input,
              cachedInput: paid.usage.cachedInput,
              output: paid.usage.output,
              costUsd: costUsd(paid.model, paid.usage),
            });
            warnUnpriced(o.run, input.stage, paid.model);
          }
          if (retried) throw error;
          appendEvent(o.run, {
            type: 'warning',
            stage: input.stage,
            message: `${input.stage} round ${round}: the answer did not match the schema (${error.message}); retrying`,
          });
          continue;
        }
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
          message: `${input.stage} round ${round}: the answer was cut at the output limit; retrying`,
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
  const user = fillPrompt(o.reviewInput ?? reviewInput, {
    system: o.system,
    user: o.user,
    output,
    known,
  });
  // A named output guide is a reviewer of its own: `<stage>-review-<name>`.
  const calls = reviewers.flatMap((reviewer): [string, string][] => {
    const guide = guides[reviewer];
    return typeof guide === 'object' ? Object.entries(guide) : [[reviewer, guide ?? '']];
  });
  const reviews = await Promise.all(
    calls.map(async ([reviewer, guide]) => {
      const messages: ChatMessage[] = [
        { role: 'system', content: fillPrompt(reviewPrompt, { guide }) },
        { role: 'user', content: user },
      ];
      // A reviewer the model cannot answer adds no blockers: the run goes on without its review.
      const skip = (name: string, error: unknown) => {
        appendEvent(o.run, {
          type: 'warning',
          stage: o.stage,
          message: `${o.stage} round ${round}: the ${name} review failed (${String(error).split('\n')[0]}); its blockers are left out`,
        });
        return [];
      };
      let first;
      try {
        first = await reviewCall(o, round, reviewer, messages, guideIds(guide));
      } catch (error) {
        return skip(reviewer, error);
      }
      if (first.missed.length === 0) return toIssues(first.data);
      // One more turn for the points it left unchecked; what it still leaves is only logged.
      messages.push(
        { role: 'assistant', content: first.raw },
        { role: 'user', content: fillPrompt(recheckPrompt, { missed: first.missed.map((id) => `- ${id}`).join('\n') }) },
      );
      try {
        const second = await reviewCall(o, round, `${reviewer}-recheck`, messages, first.missed);
        return [...toIssues(first.data), ...toIssues(second.data)];
      } catch (error) {
        return [...toIssues(first.data), ...skip(`${reviewer}-recheck`, error)];
      }
    }),
  );
  return reviews.flat();
}

/** One reviewer call, logged with its blockers and the points of `points` it did not list as checked. */
async function reviewCall<T>(
  o: SpecStageOptions<T>,
  round: number,
  reviewer: string,
  messages: ChatMessage[],
  points: string[],
) {
  const stage = `${o.stage}-review-${reviewer}`;
  appendEvent(o.run, { type: 'review:start', stage: o.stage, round, reviewer });
  const result = await o.llm.generateStructured({
    stage,
    round,
    schema: Review,
    schemaName: 'Review',
    messages: [...messages],
    model: 'default',
    reasoningEffort: REVIEW_EFFORT,
    maxTokens: REVIEW_MAX_TOKENS,
    runDir: o.run.dir,
  });
  const checked = new Set(result.data.checked);
  const missed = points.filter((id) => !checked.has(id));
  logCall(o.run, stage, round, result, { reviewer, blockers: result.data.blockers.length, missed });
  return { ...result, missed };
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
  review?: { reviewer: string; blockers: number; missed: string[] },
): void {
  if (!result.replayed) warnUnpriced(run, stage, result.model);
  appendEvent(run, {
    type: 'llm:call',
    stage,
    round,
    ...review,
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
