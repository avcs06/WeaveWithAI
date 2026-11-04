/**
 * FLOW-026 · mandatory
 * An alternative has at least one step: the path the user takes from the step it branches from.
 * Pass: { id: 'F03.A01', steps: [{ id: 'F03.A01.S01' }] }
 * Fail: { id: 'F03.A01', steps: [] }
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-026',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const flow of flows.flows) {
      for (const alternative of flow.alternatives) {
        if (alternative.steps.length === 0) {
          issues.push(
            fail(
              `${alternative.id} has no steps; write the path from ${alternative.from} as steps ${alternative.id}.S01, ... up to where it merges back or ends.`,
              alternative.id,
            ),
          );
        }
      }
    }
    return issues;
  },
);
