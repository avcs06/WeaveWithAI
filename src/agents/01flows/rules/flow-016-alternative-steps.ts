/**
 * FLOW-016 · mandatory
 * An alternative's from is a step of its own flow or subflow; resumesAt is "" (the flow ends) or a step of the same one.
 * Pass: { id: 'F03.A01', from: 'F03.S02', resumesAt: 'F03.S02' } · resumesAt: ''
 * Fail: from: 'F04.S01' inside F03 · resumesAt: 'F03.S09' when F03 has 3 steps
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { containers, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-016',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const container of containers(flows)) {
      const stepIds = new Set(container.steps.map((step) => step.id));
      for (const alternative of container.alternatives) {
        if (!stepIds.has(alternative.from)) {
          issues.push(
            fail(
              `${alternative.id} branches from "${alternative.from}", which is not a step of ${container.id}; use one of its step ids.`,
              alternative.id,
            ),
          );
        }
        if (
          alternative.resumesAt !== '' &&
          !stepIds.has(alternative.resumesAt)
        ) {
          issues.push(
            fail(
              `${alternative.id} resumes at "${alternative.resumesAt}", which is not a step of ${container.id}; use a step id or "" when the flow ends.`,
              alternative.id,
            ),
          );
        }
      }
    }
    return issues;
  },
);
