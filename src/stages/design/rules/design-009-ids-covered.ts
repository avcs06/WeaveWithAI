import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { type IaInput, type ScreensInput, stepIds } from './design-helpers';

/**
 * DESIGN-009 · mandatory
 * Every step and alternative id appears on at least one screen or node. The IA
 * already lists each on a screen or section, so a gap fails before any nodes call.
 * Pass: F05.A01 on the book page.
 * Fail: F05.A01 nowhere.
 */
export const iaRule = defineRule<IaInput>(
  'DESIGN-009',
  'mandatory',
  ({ ia, ctx }, fail) => {
    const covered = new Set([
      ...ia.screens.flatMap((s) => s.flowSteps),
      ...ia.sections.flatMap((s) => s.flowSteps),
    ]);
    return stepIds(ctx.flows)
      .filter((id) => !covered.has(id))
      .map((id) =>
        fail(
          `${id} is served by no screen or section; list it on the screen that handles it.`,
          id,
        ),
      );
  },
);

export const screensRule = defineRule<ScreensInput>(
  'DESIGN-009',
  'mandatory',
  ({ screens, ctx }, fail) => {
    const covered = new Set([
      ...screens.screens.flatMap((s) => s.flowSteps),
      ...screens.sections.flatMap((s) => s.flowSteps),
      ...screens.nodes.flatMap((n) => n.flowSteps),
    ]);
    return stepIds(ctx.flows)
      .filter((id) => !covered.has(id))
      .map((id) =>
        fail(
          `${id} appears on no screen or node; show where the design handles it.`,
          id,
        ),
      );
  },
);
