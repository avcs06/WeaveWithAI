import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { Flows } from '../../01flows/schema';
import { type IaInput, type ScreensInput, stepIds } from './helpers';

/**
 * DESIGN-009 · mandatory
 * Every step and alternative id appears on at least one screen or node. The
 * architect's plan lists each on a screen, so a gap fails before any later call.
 * A step the architect reports in `impossibleSteps`, and the alternatives
 * branching from it, are left out; the design markdown lists them.
 * Pass: F05.A01 on the book page.
 * Fail: F05.A01 nowhere.
 */
/** The steps reported impossible and the alternatives branching from them. */
function impossible(reported: { step: string }[], flows: Flows): string[] {
  const steps = new Set(reported.map((r) => r.step));
  const alternatives = [...flows.flows, ...flows.subflows]
    .flatMap((f) => f.alternatives)
    .filter((a) => steps.has(a.from))
    .map((a) => a.id);
  return [...steps, ...alternatives];
}

export const iaRule = defineRule<IaInput>(
  'DESIGN-009',
  'mandatory',
  ({ ia, ctx }, fail) => {
    const covered = new Set([
      ...ia.screens.flatMap((s) => s.flowSteps),
      ...ia.sections.flatMap((s) => s.flowSteps),
      ...impossible(ia.impossibleSteps, ctx.flows),
    ]);
    return stepIds(ctx.flows)
      .filter((id) => !covered.has(id))
      .map((id) =>
        fail(
          `No screen or section has ${id} in its flowSteps. Every step and alternative is on at least one screen. Add ${id} to the flowSteps of the screen that handles it.`,
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
      ...impossible(screens.impossibleSteps, ctx.flows),
    ]);
    return stepIds(ctx.flows)
      .filter((id) => !covered.has(id))
      .map((id) =>
        fail(
          `No screen, section or node has ${id} in its flowSteps. Every step and alternative appears on at least one screen or node. Add ${id} to the flowSteps of the screen or node that handles it.`,
          id,
        ),
      );
  },
);
