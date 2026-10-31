import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import {
  INTERACTIVE,
  type ScreensInput,
  screensOf,
  steps,
} from './helpers';

/**
 * DESIGN-008 · mandatory
 * Every user step is served by an interactive node on a screen whose flowSteps include it;
 * a shell's node is on every page that uses the shell.
 * Pass: F03.S01 on S04's Add book button, S04 listing F03.S01.
 * Fail: the Add book button without F03.S01.
 */
export const rule = defineRule<ScreensInput>(
  'DESIGN-008',
  'mandatory',
  ({ screens, ctx }, fail) => {
    const issues: Issue[] = [];
    const serving = new Map(
      screens.screens.map((s) => [s.id, new Set(s.flowSteps)]),
    );
    for (const step of steps(ctx.flows)) {
      if (step.kind !== 'user') continue;
      const served = screens.nodes.some(
        (node) =>
          INTERACTIVE.has(node.role) &&
          node.flowSteps.includes(step.id) &&
          screensOf(screens, node).some((id) => serving.get(id)?.has(step.id)),
      );
      if (!served)
        issues.push(
          fail(
            `No control serves ${step.id} ("${step.userAction}") on a screen that lists ${step.id}. Every user step is served by an action, navigation or input on a screen whose flowSteps include the step. Add ${step.id} to the flowSteps of the control that does it, on a screen that lists ${step.id}.`,
            step.id,
          ),
        );
    }
    return issues;
  },
);
