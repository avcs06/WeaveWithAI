import type { Issue } from '../../../../core/issues';
import { defineRule } from '../../../../core/rules';
import { allSteps, type ContractInput, serving } from '../helpers';

/**
 * CONTRACT-011 · mandatory
 * A step's effect is served by an operation of the matching kind on the
 * noun's entity: create, list, read by get, update by update or action, delete.
 * Pass: F05.S01 reads Book through getBook.
 * Fail: F05.S01 served by listBooks only.
 */
const KINDS = {
  create: ['create'],
  list: ['list'],
  read: ['get'],
  update: ['update', 'action'],
  delete: ['delete'],
} as const;

export const rule = defineRule<ContractInput>(
  'CONTRACT-011',
  'mandatory',
  ({ contract, flows }, fail) => {
    const issues: Issue[] = [];
    for (const step of allSteps(flows))
      for (const effect of step.effects) {
        const entity = contract.entities.find((e) => e.noun === effect.noun);
        const kinds: readonly string[] = KINDS[effect.change];
        const match = serving(contract, step.id).some(
          (op) => op.entity === entity?.name && kinds.includes(op.kind),
        );
        if (entity && !match)
          issues.push(
            fail(
              `${step.id} ${effect.change}s ${effect.noun}, but no ${kinds.join(' or ')} operation on ${entity.name} serves it.`,
              step.id,
            ),
          );
      }
    return issues;
  },
);
