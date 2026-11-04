/**
 * SCOPE-005 · mandatory
 * Assumption ids are A01, A02, ... and question ids Q01, Q02, ...: two digits or more, unique within each list.
 * Pass: assumptions: [{ id: 'A01' }, { id: 'A02' }]
 * Fail: { id: 'A1' } · 'Q01' used by two questions
 */
import type { Issue } from '../../../../../core/issues';
import { defineRule, duplicates } from '../../../../../core/rules';
import type { Scope } from '../../schema';

export const ASSUMPTION_ID = /^A\d{2,}$/;
export const QUESTION_ID = /^Q\d{2,}$/;

export const rule = defineRule<Scope>(
  'SCOPE-005',
  'mandatory',
  (scope, fail) => {
    const issues: Issue[] = [];
    const groups: {
      list: { id: string }[];
      pattern: RegExp;
      example: string;
      path: string;
    }[] = [
      {
        list: scope.assumptions,
        pattern: ASSUMPTION_ID,
        example: 'A01',
        path: 'assumptions',
      },
      {
        list: scope.questions,
        pattern: QUESTION_ID,
        example: 'Q01',
        path: 'questions',
      },
    ];
    for (const { list, pattern, example, path } of groups) {
      list.forEach((item, i) => {
        if (!pattern.test(item.id)) {
          issues.push(
            fail(
              `Id "${item.id}" is malformed; ${path} are numbered like ${example}, ${example.slice(0, 1)}02, ...`,
              `${path}[${i}].id`,
            ),
          );
        }
      });
      for (const id of duplicates(list, (item) => item.id)) {
        issues.push(
          fail(
            `Id "${id}" is used twice in ${path}; renumber so every id is unique.`,
            path,
          ),
        );
      }
    }
    return issues;
  },
);
