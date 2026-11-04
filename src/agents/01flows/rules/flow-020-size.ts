/**
 * FLOW-020 · warning
 * At most 12 steps in any flow.
 * Pass: a flow of 2 to 5 steps
 * Fail: a flow with 13 steps
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

const MAX_STEPS = 12;

export const rule = defineRule<FlowInput>(
  'FLOW-020',
  'warning',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const flow of flows.flows) {
      if (flow.steps.length > MAX_STEPS) {
        issues.push(
          fail(
            `${flow.id} has ${flow.steps.length} steps; keep at most ${MAX_STEPS} or split the flow.`,
            flow.id,
          ),
        );
      }
    }
    return issues;
  },
);
