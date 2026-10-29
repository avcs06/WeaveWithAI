/**
 * SCOPE-006 · warning
 * The summary has 2 to 4 sentences; inScope lists at least 3 items.
 * Pass: summary: 'For readers who lose track of books. They keep one list. Adding and finding a book is the core loop.' with 3 inScope items
 * Fail: summary: 'A reading list.' · inScope: ['Add a book']
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { Scope } from '../schema';

const MIN_IN_SCOPE = 3;

export const sentenceCount = (text: string): number =>
  text.split(/[.!?]+(?:\s+|$)/).filter((part) => part.trim() !== '').length;

export const rule = defineRule<Scope>('SCOPE-006', 'warning', (scope, fail) => {
  const issues: Issue[] = [];
  const sentences = sentenceCount(scope.app.summary);
  if (sentences < 2 || sentences > 4) {
    issues.push(
      fail(
        `The summary has ${sentences} sentences; write 2 to 4: who it is for, the problem, the core loop.`,
        'app.summary',
      ),
    );
  }
  if (scope.inScope.length < MIN_IN_SCOPE) {
    issues.push(
      fail(
        `inScope lists ${scope.inScope.length} items; list at least ${MIN_IN_SCOPE} things the MVP does.`,
        'inScope',
      ),
    );
  }
  return issues;
});
