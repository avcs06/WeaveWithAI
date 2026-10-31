/**
 * SCOPE-002 · mandatory
 * 1 to 16 vocabulary nouns, each unique, PascalCase and singular; belongsTo is a role id or "shared".
 * Plural heuristic: a trailing "s" unless the noun ends in ss, us or is ('Address' and 'Status' pass).
 * Pass: vocabulary: [{ noun: 'Book', belongsTo: 'reader' }, { noun: 'Shelf', belongsTo: 'shared' }]
 * Fail: { noun: 'books' } · { noun: 'Book', belongsTo: 'owner' } when no role has id 'owner'
 */
import type { Issue } from '../../../../../core/issues';
import { defineRule, duplicates, isPascal } from '../../../../../core/rules';
import type { Scope } from '../../schema';

// Plural heuristic: a trailing "s" except the singular endings "ss", "us", "is".
const looksPlural = (noun: string): boolean =>
  /s$/.test(noun) && !/(ss|us|is)$/.test(noun);

export const rule = defineRule<Scope>(
  'SCOPE-002',
  'mandatory',
  (scope, fail) => {
    const issues: Issue[] = [];
    const roleIds = new Set(scope.roles.map((role) => role.id));
    if (scope.vocabulary.length < 1 || scope.vocabulary.length > 16) {
      issues.push(
        fail(
          `${scope.vocabulary.length} vocabulary nouns; keep 1 to 16, the things the app tracks.`,
          'vocabulary',
        ),
      );
    }
    for (const noun of duplicates(scope.vocabulary, (entry) => entry.noun)) {
      issues.push(
        fail(
          `Noun "${noun}" is listed more than once; keep one entry per noun.`,
          'vocabulary',
        ),
      );
    }
    scope.vocabulary.forEach((entry, i) => {
      const at = `vocabulary[${i}]`;
      if (!isPascal(entry.noun)) {
        issues.push(
          fail(
            `Noun "${entry.noun}" is not PascalCase; write it like "Project" or "TeamMember".`,
            `${at}.noun`,
          ),
        );
      } else if (looksPlural(entry.noun)) {
        issues.push(
          fail(
            `Noun "${entry.noun}" looks plural; vocabulary nouns are singular ("Book", not "Books").`,
            `${at}.noun`,
          ),
        );
      }
      if (entry.belongsTo !== 'shared' && !roleIds.has(entry.belongsTo)) {
        issues.push(
          fail(
            `"${entry.noun}" belongs to "${entry.belongsTo}", which is not a role id or "shared".`,
            `${at}.belongsTo`,
          ),
        );
      }
    });
    return issues;
  },
);
