import type { z } from 'zod';
import { formatIssues, type Issue, splitIssues, writeReport } from './issues';
import type { ChatMessage, GenerateResult, Llm } from './llm';
import { fillPrompt, loadPrompt } from './prompt';
import { Review, toIssues } from './review';
import { appendEvent, type Run, updateStage } from './run';
import { pathBeside } from './utils';

/** Question id to the answer given. */
export type Answers = Record<string, string>;

export type SpecStageOptions<T> = {
  run: Run;
  stage: string;
  schema: z.ZodType<T>;
  schemaName: string;
  /** The filled prompt. */
  system: string;
  /** The inputs, serialized. */
  user: string;
  validate: (output: T) => Issue[];
  /** The stage's review guide (review-<stage>.md). Without it no reviewer calls run. */
  review?: string;
  /** Interactive stages only: asked after every round that produced new output. Answers never force a generation. */
  ask?: (output: T) => Promise<Answers>;
  llm: Llm;
};

export type SpecStageResult<T> = {
  output: T;
  warnings: Issue[];
  known: Issue[];
  /** Every answer given during the stage, applied or carried forward. */
  answers: Answers;
  rounds: number;
};

// D1.12: a fix runs only when something is pending; reviewers run on schedule; round 4 is the final fix.
const SCHEDULE = [
  { fix: false, reviewers: 0 },
  { fix: true, reviewers: 2 },
  { fix: true, reviewers: 1 },
  { fix: true, reviewers: 0 },
];
const STRONG_FROM_ROUND = 3;
// Higher than the generator's so the two round-2 samples differ.
const REVIEW_TEMPERATURE = 0.7;
const NOT_REREVIEWED = ' (addressed in the final fix, not re-reviewed)';

const fixupPrompt = loadPrompt(
  pathBeside(import.meta.url, './prompt-fixup.md'),
);
const answersPrompt = loadPrompt(
  pathBeside(import.meta.url, './prompt-answers.md'),
);
const reviewPrompt = loadPrompt(
  pathBeside(import.meta.url, './prompt-review.md'),
);
const reviewInput = loadPrompt(
  pathBeside(import.meta.url, './prompt-review-input.md'),
);

/** Generate, validate, review on schedule, fix what is pending; whatever is left at the end is known, never fatal. */
export async function runSpecStage<T>(
  o: SpecStageOptions<T>,
): Promise<SpecStageResult<T>> {
  const messages: ChatMessage[] = [
    { role: 'system', content: o.system },
    { role: 'user', content: o.user },
  ];
  appendEvent(o.run, { type: 'stage:start', stage: o.stage });
  updateStage(o.run, o.stage, { status: 'running' });

  const answers: Answers = {};
  // Answers given since the last generation; they ride along with the next fix, never cause one.
  let unapplied: Answers = {};
  let last: { result: GenerateResult<T>; issues: Issue[] } | undefined;

  const generate = async (round: number, pending: Issue[]) => {
    if (last) {
      const parts = [
        fillPrompt(fixupPrompt, { issues: formatIssues(pending) }),
      ];
      if (Object.keys(unapplied).length > 0) {
        parts.push(
          fillPrompt(answersPrompt, { answers: formatAnswers(unapplied) }),
        );
        unapplied = {};
      }
      messages.push(
        { role: 'assistant', content: last.result.raw },
        { role: 'user', content: parts.join('\n\n') },
      );
    }
    const result = await o.llm.generateStructured({
      stage: o.stage,
      round,
      schema: o.schema,
      schemaName: o.schemaName,
      messages,
      model: round >= STRONG_FROM_ROUND ? 'strong' : 'default',
      runDir: o.run.dir,
    });
    logCall(o.run, o.stage, round, result);
    return { result, issues: o.validate(result.data) };
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

  last = await generate(1, []);
  await askAbout(last.result.data);
  let pending: Issue[] = [];
  let blockers: Issue[] = [];
  let rounds = 1;
  for (const [index, step] of SCHEDULE.entries()) {
    const round = index + 1;
    rounds = round;
    const hasPendingIssues = pending.length > 0;
    if (step.fix && hasPendingIssues) {
      last = await generate(round, pending);
      await askAbout(last.result.data);
    }

    const didGenerate = !step.fix || hasPendingIssues;
    const { mandatory, warnings } = splitIssues(last.issues);
    const reviewers = o.review ? step.reviewers : 0;
    if (reviewers > 0) {
      blockers = await review(o, round, reviewers, last.result.raw, warnings);
    } else if (didGenerate) {
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
      generated: didGenerate,
      mandatory: mandatory.length,
      warnings: warnings.length,
      blockers: blockers.length,
    });
    if (pending.length === 0 && (reviewers > 0 || !o.review)) break;
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
    output: last.result.data,
    warnings,
    known: pending,
    answers,
    rounds,
  };
}

async function review<T>(
  o: SpecStageOptions<T>,
  round: number,
  count: number,
  output: string,
  warnings: Issue[],
) {
  const system = fillPrompt(reviewPrompt, { guide: o.review ?? '' });
  const known = warnings.length > 0 ? formatIssues(warnings) : 'None.';
  const samples = Array.from({ length: count }, (_, i) => i + 1);
  const reviews = await Promise.all(
    samples.map(async (i) => {
      const stage = `${o.stage}-review${i}`;
      const user = fillPrompt(reviewInput, {
        sample: `Reviewer ${i} of ${count}`,
        system: o.system,
        user: o.user,
        output,
        known,
      });
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
        temperature: REVIEW_TEMPERATURE,
        runDir: o.run.dir,
      });
      logCall(o.run, stage, round, result);
      return result.data;
    }),
  );
  return reviews.flatMap(toIssues);
}

function formatAnswers(answers: Answers): string {
  return Object.entries(answers)
    .map(([id, answer]) => `- ${id}: ${answer}`)
    .join('\n');
}

function logCall(
  run: Run,
  stage: string,
  round: number,
  result: GenerateResult<unknown>,
): void {
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
