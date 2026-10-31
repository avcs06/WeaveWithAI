import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { type Run, runPath } from '../../core/run';
import type { Answers } from '../../runner/runSpecStage';
import type { Question } from './schema';

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
