import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { readArtifact, writeArtifact } from '../../core/artifacts';
import { type Run, runPath } from '../../core/run';
import { type Answers, runSpecStage } from '../../core/runSpecStage';
import { writeJsonAtomic } from '../../core/utils';
import type { StageContext, StageDef } from '../index';
import {
  flowsReviewGuide,
  flowsSystemPrompt,
  flowsUserMessage,
  scopeReviewGuide,
  scopeSystemPrompt,
  scopeUserMessage,
} from './prompt';
import { renderFlows, renderScope } from './render';
import { Flows, type Question, Scope } from './schema';
import { validateFlows, validateScope } from './validate';

// Reasoning tokens count toward the budget (D1.13); the flows JSON alone can pass 10k tokens.
const SCOPE_MAX_TOKENS = 16_384;
const FLOWS_MAX_TOKENS = 32_768;

export function readAnswers(run: Run): Answers {
  const file = runPath(run, 'input', 'answers.json');
  return existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as Answers)
    : {};
}

/** Reads one line from the terminal; tests pass their own. */
export type AskIo = (prompt: string) => Promise<string>;

const readLine: AskIo = async (prompt) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(prompt);
  } finally {
    rl.close();
  }
};

/** Asks the blocking questions not answered yet, once each; Enter keeps the default, which then counts as the answer. */
export function terminalAsk(
  known: Answers,
  io: AskIo = readLine,
  out: (line: string) => void = console.log,
) {
  const asked = new Set<string>();
  // An earlier run's answer counts for the same question only; a fresh draft may reuse the id for another one.
  const answeredBefore = (q: Question) => known[q.id]?.question === q.question;
  return async ({ questions }: { questions: Question[] }): Promise<Answers> => {
    const answers: Answers = {};
    for (const question of questions.filter(
      (q) => q.blocking && !asked.has(q.id) && !answeredBefore(q),
    )) {
      asked.add(question.id);
      out(
        `\n${question.id}: ${question.question}\n  Why: ${question.whyItMatters}\n  Default: ${question.defaultAnswer}`,
      );
      const typed = (await io('  Answer (Enter keeps the default): ')).trim();
      answers[question.id] = {
        question: question.question,
        answer: typed === '' ? question.defaultAnswer : typed,
      };
    }
    return answers;
  };
}

async function runScope(ctx: StageContext): Promise<void> {
  const { run, llm } = ctx;
  const idea = readFileSync(runPath(run, 'input', 'idea.md'), 'utf8');
  const answers = readAnswers(run);
  const result = await runSpecStage({
    run,
    stage: 'scope',
    schema: Scope,
    schemaName: 'Scope',
    system: scopeSystemPrompt(answers),
    user: scopeUserMessage(idea),
    validate: validateScope,
    review: scopeReviewGuide(),
    ask: ctx.interactive ? terminalAsk(answers) : undefined,
    maxTokens: SCOPE_MAX_TOKENS,
    llm,
  });
  writeJsonAtomic(runPath(run, 'input', 'answers.json'), {
    ...answers,
    ...result.answers,
  });
  writeArtifact(run, 'scope', result.output, {
    stage: 'scope',
    model: result.model,
    rounds: result.rounds,
    inputs: [],
  });
  writeFileSync(runPath(run, '01-scope.md'), renderScope(result.output));
}

async function runFlows(ctx: StageContext): Promise<void> {
  const { run, llm } = ctx;
  const idea = readFileSync(runPath(run, 'input', 'idea.md'), 'utf8');
  const scope = readArtifact<Scope>(run, 'scope').data;
  const answers = readAnswers(run);
  const result = await runSpecStage({
    run,
    stage: 'flows',
    schema: Flows,
    schemaName: 'Flows',
    system: flowsSystemPrompt(answers),
    user: flowsUserMessage(idea, scope),
    validate: (flows) => validateFlows(flows, scope),
    review: flowsReviewGuide(),
    ask: ctx.interactive ? terminalAsk(answers) : undefined,
    maxTokens: FLOWS_MAX_TOKENS,
    llm,
  });
  writeJsonAtomic(runPath(run, 'input', 'answers.json'), {
    ...answers,
    ...result.answers,
  });
  writeArtifact(run, 'flows', result.output, {
    stage: 'flows',
    model: result.model,
    rounds: result.rounds,
    inputs: ['scope'],
  });
  writeFileSync(runPath(run, '01-flows.md'), renderFlows(result.output, scope));
}

export const scopeStage: StageDef = {
  name: 'scope',
  produces: ['scope'],
  run: runScope,
  validate: (run) => validateScope(readArtifact<Scope>(run, 'scope').data),
};

export const flowsStage: StageDef = {
  name: 'flows',
  produces: ['flows'],
  run: runFlows,
  validate: (run) =>
    validateFlows(
      readArtifact<Flows>(run, 'flows').data,
      readArtifact<Scope>(run, 'scope').data,
    ),
};
