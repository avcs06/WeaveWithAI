/**
 * FLOW-013 · mandatory
 * A step that deletes has a 'confirm' or a 'cancel' alternative branching from it, in flows and subflows alike.
 * Pass: SF01.S01 deletes Book; { id: 'SF01.A01', kind: 'cancel', from: 'SF01.S01' }
 * Fail: the delete step with only an 'invalid' alternative
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { alternativesFrom, eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-013',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const { container, step } of eachStep(flows)) {
      const deletes = step.effects.filter(
        (effect) => effect.change === 'delete',
      );
      if (deletes.length === 0) continue;
      const kinds = new Set(
        alternativesFrom(container, step.id).map(
          (alternative) => alternative.kind,
        ),
      );
      if (!kinds.has('confirm') && !kinds.has('cancel')) {
        const nouns = deletes.map((effect) => effect.noun).join(', ');
        issues.push(
          fail(
            `${step.id} deletes ${nouns} with no "confirm" or "cancel" alternative; add ${container.id}.A0n from ${step.id} so the user can back out.`,
            step.id,
          ),
        );
      }
    }
    return issues;
  },
);
