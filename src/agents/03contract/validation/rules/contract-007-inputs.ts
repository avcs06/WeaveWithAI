import type { Issue } from '../../../../core/issues';
import { defineRule } from '../../../../core/rules';
import { type ContractInput, entityOf } from '../helpers';

/**
 * CONTRACT-007 · mandatory
 * Inputs resolve: each is a flow field, set as a field of the operation's
 * entity or, on a list, as q for search; a get or a delete takes none.
 * Pass: createBook takes FD03 as title.
 * Fail: createBook takes FD03 as isbn.
 */
export const rule = defineRule<ContractInput>(
  'CONTRACT-007',
  'mandatory',
  ({ contract, flows }, fail) => {
    const issues: Issue[] = [];
    const fields = new Set(flows.fields.map((f) => f.id));
    for (const op of contract.operations) {
      if ((op.kind === 'get' || op.kind === 'delete') && op.inputs.length)
        issues.push(
          fail(
            `${op.id} is a ${op.kind}, which takes no inputs; move them to the operation that saves or lists.`,
            op.id,
          ),
        );
      const entity = entityOf(contract, op.entity);
      for (const input of op.inputs) {
        if (!fields.has(input.field))
          issues.push(
            fail(
              `${op.id} takes ${input.field}, which is not a field of the flows.`,
              op.id,
            ),
          );
        if (input.as === 'q') {
          if (op.kind !== 'list')
            issues.push(
              fail(
                `${op.id} takes ${input.field} as q, but only a list searches; set an entity field instead.`,
                op.id,
              ),
            );
        } else if (entity && !entity.fields.some((f) => f.name === input.as))
          issues.push(
            fail(
              `${op.id} takes ${input.field} as ${input.as}, but ${entity.name} has no field ${input.as}; add the field or name one it has.`,
              op.id,
            ),
          );
      }
    }
    return issues;
  },
);
