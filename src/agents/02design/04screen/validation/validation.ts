import type { Issue } from '../../../../core/issues';
import { duplicates, issue, type Rule, runRules } from '../../../../core/rules';
import type { Processed as Plan } from '../../02architect/process';
import type { Processed as Catalog } from '../../03catalog/process';
import { screenRule as design001 } from '../../rules/design-001-ids';
import { screenRule as design029 } from '../../rules/design-029-composition';
import { screenRule as design030 } from '../../rules/design-030-heading-plan';
import { rule as design037 } from '../../rules/design-037-rows-fit';
import { rule as design038 } from '../../rules/design-038-slot-fills';
import { rule as design039 } from '../../rules/design-039-fill-instances';
import { screenRule as design048 } from '../../rules/design-048-confirmation-words';
import type { DesignContext, ScreenInput } from '../../rules/helpers';
import type { ScreenLayouts } from '../schema';

// A screen call's checks (DS23): each screen it was given laid out once, and
// each layout's rules.

export const screenRules: readonly Rule<ScreenInput>[] = [
  design001,
  design029,
  design030,
  design037,
  design038,
  design039,
  design048,
];

export function validateLayouts(
  out: ScreenLayouts,
  ids: string[],
  plan: Plan,
  catalog: Catalog,
  ctx: DesignContext,
  measure: (screen: string) => { width: number; gapPx: number },
): Issue[] {
  const fail = (message: string, at: string) => issue('DESIGN-029', 'mandatory', message, at);
  const laid = out.screens.map((s) => s.screen);
  return [
    ...ids.filter((id) => !laid.includes(id)).map((id) => fail(`${id} has no layout in the answer. The answer lays out each screen it was given exactly once: ${ids.join(', ')}. Add a layout for ${id}.`, id)),
    ...duplicates(out.screens, (s) => s.screen).map((id) => fail(`${id} is laid out more than once. Each screen has exactly one layout. Keep one layout of ${id}, and drop the others.`, id)),
    ...out.screens.flatMap((layout) => {
      const screen = plan.screens.find((s) => s.id === layout.screen);
      if (!screen || !ids.includes(layout.screen))
        return [fail(`${layout.screen} is not one of the screens this call lays out: ${ids.join(', ')}. The answer lays out only those screens. Drop the layout of ${layout.screen}.`, layout.screen)];
      return runRules(screenRules, { layout, screen, catalog, ctx, ...measure(layout.screen) });
    }),
  ];
}
