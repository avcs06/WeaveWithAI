/**
 * FLOW-013 · mandatory
 * A step that deletes lets the user back out: it has a 'confirm' or 'cancel' alternative of its own.
 * Pass: F05.S02 deletes Book with { kind: 'cancel', from: 'F05.S02' }
 * Fail: F05.S02 deletes Book and has no confirm or cancel alternative
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { alternativesFrom, type FlowInput } from './helpers';

const BACK_OUT = new Set(['confirm', 'cancel']);

export const rule = defineRule<FlowInput>(
  'FLOW-013',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const flow of flows.flows) {
      for (const step of flow.steps) {
        const deletes = step.effects.filter(
          (effect) => effect.change === 'delete',
        );
        if (deletes.length === 0) continue;
        const backsOut = alternativesFrom(flow, step.id).some(
          (alternative) => BACK_OUT.has(alternative.kind),
        );
        if (!backsOut) {
          const nouns = deletes.map((effect) => effect.noun).join(', ');
          issues.push(
            fail(
              `${step.id} deletes ${nouns} with no way to back out; add a "confirm" or "cancel" alternative from ${step.id}.`,
              step.id,
            ),
          );
        }
      }
    }
    return issues;
  },
);
