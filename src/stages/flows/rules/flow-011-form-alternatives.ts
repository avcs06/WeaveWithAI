/**
 * FLOW-011 · mandatory
 * A user step with fields whose effects create or update has an 'invalid' and a 'failure' alternative branching from it.
 * Pass: F03.S02 saves fields; alternatives { id: 'F03.A01', kind: 'invalid', from: 'F03.S02' } and { id: 'F03.A02', kind: 'failure', from: 'F03.S02' }
 * Fail: the same step with only the 'invalid' alternative
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { alternativesFrom, eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-011',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const { flow, step } of eachStep(flows)) {
      const saves = step.effects.some(
        (effect) => effect.change === 'create' || effect.change === 'update',
      );
      if (step.kind !== 'user' || step.fields.length === 0 || !saves) continue;
      const kinds = new Set(
        alternativesFrom(flow, step.id).map((alternative) => alternative.kind),
      );
      for (const kind of ['invalid', 'failure'] as const) {
        if (!kinds.has(kind)) {
          issues.push(
            fail(
              `${step.id} saves fields but has no "${kind}" alternative; add ${flow.id}.A0n with kind ${kind} from ${step.id}.`,
              step.id,
            ),
          );
        }
      }
    }
    return issues;
  },
);
