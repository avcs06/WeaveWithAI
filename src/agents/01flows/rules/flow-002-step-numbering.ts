/**
 * FLOW-002 · mandatory
 * Steps are numbered S01, S02, ... in order, without gaps, in flows and subflows alike.
 * Pass: steps: [{ id: 'F06.S01' }, { id: 'F06.S02' }]
 * Fail: steps: [{ id: 'F06.S02' }] · [{ id: 'F06.S01' }, { id: 'F06.S03' }]
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { containers, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-002',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const container of containers(flows)) {
      container.steps.forEach((step, i) => {
        const number = Number(step.id.split('.S')[1]);
        if (Number.isFinite(number) && number !== i + 1) {
          issues.push(
            fail(
              `${step.id} is step ${i + 1} of ${container.id}; number steps S01, S02, ... without gaps.`,
              step.id,
            ),
          );
        }
      });
    }
    return issues;
  },
);
