import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Processed as Plan } from '../../03architect/process';
import { catalogRule as design019Catalog } from '../../rules/design-019-data';
import { catalogRule as design029 } from '../../rules/design-029-composition';
import { catalogRule as design030 } from '../../rules/design-030-heading-plan';
import { catalogRule as design031 } from '../../rules/design-031-states-fields';
import { rule as design040 } from '../../rules/design-040-steps-served';
import { rule as design041 } from '../../rules/design-041-widths-fit';
import { rule as design046 } from '../../rules/design-046-shared-widgets';
import type { CatalogInput, DesignContext } from '../../rules/helpers';
import type { Processed } from '../process';

// The catalog's checks (DS23), on its definitions after its processing step.


export const catalogRules: readonly Rule<CatalogInput>[] = [
  design019Catalog,
  design029,
  design030,
  design031,
  design040,
  design041,
  design046,
];

export function validateCatalog(
  catalog: Processed,
  plan: Plan,
  ctx: DesignContext,
  widthOf: (screen: string) => number,
): Issue[] {
  return runRules(catalogRules, { catalog, plan, ctx, widthOf });
}
