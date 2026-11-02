/**
 * FLOW-002 · mandatory
 * Steps are numbered S01, S02, ... in order, without gaps, in a flow and in each of its alternatives.
 * Pass: steps: [{ id: 'F06.S01' }, { id: 'F06.S02' }]
 * Fail: steps: [{ id: 'F06.S02' }] · [{ id: 'F06.S01' }, { id: 'F06.S03' }]
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-002',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const flow of flows.flows) {
      const sequences = [
        { parent: flow.id, steps: flow.steps },
        ...flow.alternatives.map((alternative) => ({
          parent: alternative.id,
          steps: alternative.steps,
        })),
      ];
      for (const { parent, steps } of sequences) {
        steps.forEach((step, i) => {
          const number = Number(step.id.split('.S')[1]);
          if (Number.isFinite(number) && number !== i + 1) {
            issues.push(
              fail(
                `${step.id} is step ${i + 1} of ${parent}; number steps S01, S02, ... without gaps.`,
                step.id,
              ),
            );
          }
        });
      }
    }
    return issues;
  },
);
