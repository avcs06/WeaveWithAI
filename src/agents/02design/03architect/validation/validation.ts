import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Layouts } from '../../02theme/schema';
import { iaRule as design001 } from '../../rules/design-001-ids';
import {
  planRule as design004,
} from '../../rules/design-004-new-component-reasons';
import { rule as design005 } from '../../rules/design-005-new-component-names';
import { iaRule as design009 } from '../../rules/design-009-ids-covered';
import { planRule as design017 } from '../../rules/design-017-reachable';
import { rule as design021 } from '../../rules/design-021-serves-steps';
import { rule as design023 } from '../../rules/design-023-shells';
import { rule as design036 } from '../../rules/design-036-navigation-slot';
import { rule as design043 } from '../../rules/design-043-screen-types';
import { rule as design045 } from '../../rules/design-045-form-screen';
import { rule as design047 } from '../../rules/design-047-confirm-dialogs';
import type { DesignContext, IaInput, PlanInput } from '../../rules/helpers';
import { planAsIa, type Processed } from '../process';

// The architect's checks (DS23), on the plan after its processing step: its
// own rules, and the IA rules that hold for screens with no widgets yet.

export const planRules: readonly Rule<PlanInput>[] = [design004, design017, design036, design043, design045, design047];

export const planIaRules: readonly Rule<IaInput>[] = [
  design001,
  design005,
  design009,
  design021,
  design023,
];

export function validatePlan(plan: Processed, layouts: Layouts, ctx: DesignContext): Issue[] {
  return [
    ...runRules(planRules, { plan, layouts, ctx }),
    ...runRules(planIaRules, { ia: planAsIa(plan), ctx }),
  ];
}
