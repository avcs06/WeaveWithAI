import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import {
  type ScreensInput,
  screensOf,
  stepFields,
  steps,
} from './helpers';

/**
 * DESIGN-010 · mandatory
 * Every field of a user step has an input node for it on a screen serving the step.
 * Pass: FD03 Title as an input on S05, which serves F03.S02.
 * Fail: no input for FD03.
 */
export const rule = defineRule<ScreensInput>(
  'DESIGN-010',
  'mandatory',
  ({ screens, ctx }, fail) => {
    const issues: Issue[] = [];
    const serving = new Map(
      screens.screens.map((s) => [s.id, new Set(s.flowSteps)]),
    );
    for (const step of steps(ctx.flows)) {
      if (step.kind !== 'user') continue;
      for (const field of stepFields(ctx.flows, step)) {
        const found = screens.nodes.some(
          (node) =>
            node.role === 'input' &&
            node.field === field &&
            screensOf(screens, node).some((id) =>
              serving.get(id)?.has(step.id),
            ),
        );
        if (!found)
          issues.push(
            fail(
              `${step.id} asks for the field ${field}, but no input with field ${field} is on a screen serving ${step.id}. Every field of a user step has an input on a screen serving the step. Add an input with field ${field} on a screen that lists ${step.id}.`,
              step.id,
            ),
          );
      }
    }
    return issues;
  },
);
