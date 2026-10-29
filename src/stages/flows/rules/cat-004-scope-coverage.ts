/**
 * CAT-004 · warning
 * Every in-scope item of the scope is covered: one flow's name and description carry at least two of its distinctive words (all of them when it has fewer).
 * Pass: inScope 'Delete a book' with flow F05 'Delete a book'
 * Fail: inScope 'Rate a finished book' when no flow mentions rating
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { CatalogInput } from './helpers';

const STOP = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'to',
  'in',
  'on',
  'by',
  'with',
  'for',
  'its',
  'their',
  'is',
  'are',
  'be',
  'it',
  'as',
  'at',
  'from',
  'that',
  'this',
  'each',
  'every',
  'one',
  'when',
  'where',
  'who',
  'what',
  'how',
  'can',
  'all',
  'any',
  'not',
  'no',
]);
const words = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP.has(word))
    .map((word) => word.replace(/s$/, ''));

export const rule = defineRule<CatalogInput>(
  'CAT-004',
  'warning',
  ({ catalog, scope }, fail) => {
    const issues: Issue[] = [];
    const flowWords = catalog.flows.map(
      (flow) => new Set(words(`${flow.name} ${flow.description}`)),
    );
    scope.inScope.forEach((item, i) => {
      const itemWords = [...new Set(words(item))];
      // One flow must carry the item: at least two of its distinctive words, or all of them when it has fewer.
      const needed = Math.min(2, itemWords.length);
      const covered = flowWords.some(
        (set) => itemWords.filter((word) => set.has(word)).length >= needed,
      );
      if (!covered) {
        issues.push(
          fail(
            `In-scope item "${item}" matches no flow name or description; add the flow that covers it or reword one that does.`,
            `inScope[${i}]`,
          ),
        );
      }
    });
    return issues;
  },
);
