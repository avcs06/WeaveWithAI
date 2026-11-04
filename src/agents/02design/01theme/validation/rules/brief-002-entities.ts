import type { Issue } from '../../../../../core/issues';
import { duplicates, defineRule } from '../../../../../core/rules';
import type { BriefInput } from '../helpers';

/**
 * BRIEF-002 · mandatory
 * The entities are the scope vocabulary's nouns: each noun once, no other.
 * Pass: Book and Shelf for a vocabulary of Book and Shelf.
 * Fail: Shelf missing.
 */
export const rule = defineRule<BriefInput>(
  'BRIEF-002',
  'mandatory',
  ({ brief, scope }, fail) => {
    const issues: Issue[] = [];
    const nouns = scope.vocabulary.map((word) => word.noun);
    const listed = new Set(brief.entities.map((entity) => entity.noun));
    for (const noun of nouns)
      if (!listed.has(noun))
        issues.push(
          fail(
            `${noun} is missing from entities; list every vocabulary noun, colored or not.`,
            'entities',
          ),
        );
    for (const { noun } of brief.entities)
      if (!nouns.includes(noun))
        issues.push(
          fail(
            `${noun} is not a noun of the scope vocabulary; entities are ${nouns.join(', ')}.`,
            noun,
          ),
        );
    for (const noun of duplicates(brief.entities, (entity) => entity.noun))
      issues.push(fail(`${noun} is listed twice; list each noun once.`, noun));
    return issues;
  },
);
