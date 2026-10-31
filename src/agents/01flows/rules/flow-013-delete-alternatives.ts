/**
 * FLOW-013 · mandatory
 * A step that deletes lets the user back out: it has a 'confirm' or 'cancel' alternative of its own, or it runs a subflow that has one (the standard STD01).
 * Pass: F05.S02 runs STD01 (which has confirm and cancel) with effects [{ noun: 'Book', change: 'delete' }] · SF01.S02 deletes with { kind: 'cancel', from: 'SF01.S02' }
 * Fail: F05.S02 deletes Book, runs no subflow and has no confirm or cancel alternative
 */
import { STANDARD_SUBFLOWS } from '../config/subflows';
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { alternativesFrom, containers, type FlowInput } from './helpers';

const BACK_OUT = new Set(['confirm', 'cancel']);
const CONFIRMATION = STANDARD_SUBFLOWS.find((subflow) =>
  subflow.alternatives.some((alternative) => BACK_OUT.has(alternative.kind)),
)?.id;

export const rule = defineRule<FlowInput>(
  'FLOW-013',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const container of containers(flows)) {
      for (const step of container.steps) {
        const deletes = step.effects.filter(
          (effect) => effect.change === 'delete',
        );
        if (deletes.length === 0) continue;
        const subflow = flows.subflows.find(
          (candidate) => candidate.id === step.subflow,
        );
        const backsOut = [
          ...alternativesFrom(container, step.id),
          ...(subflow?.alternatives ?? []),
        ].some((alternative) => BACK_OUT.has(alternative.kind));
        if (!backsOut) {
          const nouns = deletes.map((effect) => effect.noun).join(', ');
          issues.push(
            fail(
              `${step.id} deletes ${nouns} with no way to back out; run the standard subflow ${CONFIRMATION} from this step (subflow: "${CONFIRMATION}", the delete effect stays on the step), or add a "confirm" or "cancel" alternative from it.`,
              step.id,
            ),
          );
        }
      }
    }
    return issues;
  },
);
