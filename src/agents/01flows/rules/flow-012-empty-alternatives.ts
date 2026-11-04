/**
 * FLOW-012 · mandatory
 * A step that lists a noun has an 'empty' alternative branching from it.
 * Pass: F04.S01 lists Book; { id: 'F04.A01', kind: 'empty', from: 'F04.S01' }
 * Fail: the listing step with no 'empty' alternative
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { alternativesFrom, eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-012',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const { flow, step } of eachStep(flows)) {
      const lists = step.effects.filter((effect) => effect.change === 'list');
      if (lists.length === 0) continue;
      if (
        !alternativesFrom(flow, step.id).some(
          (alternative) => alternative.kind === 'empty',
        )
      ) {
        const nouns = lists.map((effect) => effect.noun).join(', ');
        issues.push(
          fail(
            `${step.id} lists ${nouns} but has no "empty" alternative; add ${flow.id}.A0n with kind empty from ${step.id} saying what the user sees when there is nothing yet.`,
            step.id,
          ),
        );
      }
    }
    return issues;
  },
);
