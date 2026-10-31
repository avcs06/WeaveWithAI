/**
 * FLOW-020 · warning
 * 4 to 24 flows, and at most 16 steps in any flow.
 * Pass: 6 flows of 2 to 5 steps each
 * Fail: 3 flows · a flow with 17 steps
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

const MIN_FLOWS = 4;
const MAX_FLOWS = 24;
const MAX_STEPS = 16;

export const rule = defineRule<FlowInput>(
  'FLOW-020',
  'warning',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    const count = flows.flows.length;
    if (count < MIN_FLOWS || count > MAX_FLOWS) {
      issues.push(
        fail(
          `${count} flows; an MVP has ${MIN_FLOWS} to ${MAX_FLOWS}. ${count < MIN_FLOWS ? 'Cover the core loop end to end.' : 'Merge or drop flows that are not the core loop.'}`,
          'flows',
        ),
      );
    }
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
