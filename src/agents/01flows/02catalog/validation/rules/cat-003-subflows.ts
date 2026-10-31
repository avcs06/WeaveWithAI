/**
 * CAT-003 · mandatory
 * Subflows are SF01, SF02, ... (or a standard subflow's registry id), unique, named, with at least one step; a subflow is shared, so it never belongs to one role's wording.
 * Pass: { id: 'SF01', name: 'Confirm a deletion', steps: [{ id: 'SF01.S01', ... }] }
 * Fail: { id: 'S1' } · { id: 'STD09' } not in the registry · { id: 'SF01', steps: [] } · two subflows with id 'SF01'
 */
import type { Issue } from '../../../../../core/issues';
import { defineRule, duplicates } from '../../../../../core/rules';
import { isSubflowId } from '../../../rules/flow-001-ids';
import type { CatalogInput } from '../../../rules/helpers';

export const rule = defineRule<CatalogInput>(
  'CAT-003',
  'mandatory',
  ({ catalog }, fail) => {
    const issues: Issue[] = [];
    catalog.subflows.forEach((subflow, i) => {
      const at = `subflows[${i}]`;
      if (!isSubflowId(subflow.id))
        issues.push(
          fail(
            `Subflow id "${subflow.id}" is malformed; use SF01, SF02, ... (the standard subflows keep their own ids).`,
            at,
          ),
        );
      if (subflow.name.trim() === '')
        issues.push(
          fail(
            `Subflow ${subflow.id} has no name; say what the shared steps do.`,
            at,
          ),
        );
      if (subflow.steps.length === 0)
        issues.push(
          fail(
            `Subflow ${subflow.id} has no steps; a subflow is a step sequence flows share.`,
            at,
          ),
        );
    });
    for (const id of duplicates(catalog.subflows, (subflow) => subflow.id)) {
      issues.push(
        fail(
          `Subflow id "${id}" is used more than once; number subflows SF01, SF02, ... once each.`,
          'subflows',
        ),
      );
    }
    return issues;
  },
);
