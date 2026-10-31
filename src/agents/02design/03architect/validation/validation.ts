import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import { legacyIa } from '../../09assemble/assemble';
import {
  rule as design004,
  declarationRule as design004Declared,
} from '../../rules/design-004-new-component-reasons';
import { iaRule as design028Ia } from '../../rules/design-028-copy';
import { iaRule as design029 } from '../../rules/design-029-composition';
import { iaRule as design030Ia } from '../../rules/design-030-heading-plan';
import { iaRule as design031 } from '../../rules/design-031-states-fields';
import type { DesignContext, WidgetIaInput } from '../../rules/helpers';
import { iaRules } from '../../rules/index';
import type { WidgetIa } from '../schema';

// The IA call's checks (DS23): its own rules on the widget IA, and the older IA
// rules on the sections its placements make.

/** Rules on the widget IA itself: the copy deck, the composition, the heading plan, states and fields. */
export const widgetIaRules: readonly Rule<WidgetIaInput>[] = [
  design028Ia,
  design029,
  design030Ia,
  design031,
];

/** The IA rules on the widget IA's legacy shape; of a new component only its declaration, as its design is its own call's. */
const legacyIaRules = [
  ...iaRules.filter((rule) => rule !== design004),
  design004Declared,
];

/** The IA call's output: its own rules, and the older IA rules on the sections its placements make. */
export function validateWidgetIa(ia: WidgetIa, ctx: DesignContext): Issue[] {
  return [
    ...runRules(widgetIaRules, { ia, ctx }),
    ...runRules(legacyIaRules, { ia: legacyIa(ia), ctx }),
  ];
}
