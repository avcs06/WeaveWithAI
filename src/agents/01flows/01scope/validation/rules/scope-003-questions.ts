/**
 * SCOPE-003 · mandatory
 * Every question has a defaultAnswer; at most 5 questions are blocking.
 * Pass: questions: [{ id: 'Q01', defaultAnswer: 'One list per reader.', blocking: true }]
 * Fail: { id: 'Q01', defaultAnswer: '' } · six questions with blocking: true
 */
import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { Scope } from '../../schema';

const MAX_BLOCKING = 5;

export const rule = defineRule<Scope>(
  'SCOPE-003',
  'mandatory',
  (scope, fail) => {
    const issues: Issue[] = [];
    scope.questions.forEach((question, i) => {
      if (question.defaultAnswer.trim() === '') {
        issues.push(
          fail(
            `${question.id} has no defaultAnswer; say what will be assumed if nobody answers.`,
            `questions[${i}]`,
          ),
        );
      }
    });
    const blocking = scope.questions.filter(
      (question) => question.blocking,
    ).length;
    if (blocking > MAX_BLOCKING) {
      issues.push(
        fail(
          `${blocking} blocking questions; at most ${MAX_BLOCKING}. Keep blocking only where a wrong default makes the app wrong.`,
          'questions',
        ),
      );
    }
    return issues;
  },
);
