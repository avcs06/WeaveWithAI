/**
 * FLOW-011 · mandatory
 * A user step with fields (its own or its form's) whose effects create or update has a 'failure' alternative branching from it,
 * and an 'invalid' one when a field can be typed wrong. A pick from a list of choices, or a yes or no, cannot.
 * Pass: F03.S02 saves form FM01; alternatives { id: 'F03.A01', kind: 'invalid', from: 'F03.S02' } and { id: 'F03.A02', kind: 'failure', from: 'F03.S02' }
 * Fail: the same step with only the 'invalid' alternative
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { stepFields } from '../schema';
import { alternativesFrom, eachStep, type FlowInput } from './helpers';

const PICKS = new Set(['boolean', 'singleChoice', 'multiChoice']);

export const rule = defineRule<FlowInput>(
  'FLOW-011',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const { flow, step } of eachStep(flows)) {
      const saves = step.effects.some(
        (effect) => effect.change === 'create' || effect.change === 'update',
      );
      const fields = stepFields(step, flows);
      if (step.kind !== 'user' || fields.length === 0 || !saves) continue;
      const kinds = new Set(
        alternativesFrom(flow, step.id).map(
          (alternative) => alternative.kind,
        ),
      );
      const needed = fields.every((field) => PICKS.has(field.type))
        ? (['failure'] as const)
        : (['invalid', 'failure'] as const);
      for (const kind of needed) {
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
