import type { Issue } from '../../../../core/issues';
import { defineRule } from '../../../../core/rules';
import { allSteps, type ContractInput } from '../helpers';

/**
 * CONTRACT-010 · mandatory
 * Every operation serves a flow step; every step with effects is served by an
 * operation.
 * Pass: createBook serves F03.S02.
 * Fail: createBook serves nothing.
 */
export const rule = defineRule<ContractInput>(
  'CONTRACT-010',
  'mandatory',
  ({ contract, flows }, fail) => {
    const issues: Issue[] = [];
    const steps = allSteps(flows);
    const affecting = new Set(
      steps.filter((s) => s.effects.length).map((s) => s.id),
    );
    for (const op of contract.operations)
      if (!op.flowSteps.length)
        issues.push(
          fail(
            `${op.id} serves no flow step; name the steps it serves or drop it.`,
            op.id,
          ),
        );
    const served = new Set(contract.operations.flatMap((op) => op.flowSteps));
    for (const id of affecting)
      if (!served.has(id))
        issues.push(
          fail(
            `${id} changes data but no operation serves it; add it to an operation's flowSteps.`,
            id,
          ),
        );
    return issues;
  },
);
