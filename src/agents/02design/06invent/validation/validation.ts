import type { Issue } from '../../../../core/issues';
import { runRules } from '../../../../core/rules';
import type { WidgetIa } from '../../03architect/schema';
import { legacyIa } from '../../09assemble/assemble';
import { designRule as design004Designed } from '../../rules/design-004-new-component-reasons';
import type { DesignContext } from '../../rules/helpers';
import type { NewComponent } from '../../schema';

// A component call's check (DS23): the design half of DESIGN-004.

/** A component call's design of one declared component. */
export function validateComponent(
  component: NewComponent,
  ia: WidgetIa,
  ctx: DesignContext,
): Issue[] {
  return runRules([design004Designed], {
    ia: { ...legacyIa(ia), newComponents: [component] },
    ctx,
  });
}
