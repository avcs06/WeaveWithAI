/**
 * CAT-001 · mandatory
 * Every flow in the catalog has a description saying what it does.
 * Pass: { id: 'F03', description: 'The reader adds a book with its title, author and shelf; it appears first in the list.' }
 * Fail: { id: 'F03', description: '' }
 */
import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { CatalogInput } from '../../../rules/helpers';

export const rule = defineRule<CatalogInput>(
  'CAT-001',
  'mandatory',
  ({ catalog }, fail) => {
    const issues: Issue[] = [];
    for (const flow of catalog.flows) {
      if (flow.description.trim() === '') {
        issues.push(
          fail(
            `${flow.id} has no description; say in a paragraph what the flow does, so it can be expanded later.`,
            flow.id,
          ),
        );
      }
    }
    return issues;
  },
);
