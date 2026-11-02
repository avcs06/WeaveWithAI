import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Scope } from '../../01scope/schema';
import { rule as flow001 } from '../../rules/flow-001-ids';
import { rule as flow003 } from '../../rules/flow-003-role';
import { rule as flow005 } from '../../rules/flow-005-choice-options';
import { rule as flow006 } from '../../rules/flow-006-field-names';
import { rule as flow007 } from '../../rules/flow-007-field-consistency';
import { rule as flow014 } from '../../rules/flow-014-auth-flows';
import { rule as flow015 } from '../../rules/flow-015-role-coverage';
import { rule as flow019 } from '../../rules/flow-019-outcome';
import { rule as flow021 } from '../../rules/flow-021-field-meaning-example';
import { rule as flow023 } from '../../rules/flow-023-new-ids';
import { rule as flow025 } from '../../rules/flow-025-signed-out';
import {
  catalogAsFlows,
  type CatalogInput,
  type FlowInput,
} from '../../rules/helpers';
import type { Catalog } from '../schema';
import { rule as cat001 } from './rules/cat-001-descriptions';
import { rule as cat002 } from './rules/cat-002-forms';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

/** The catalog has headers and no steps yet: the flow rules that check headers and parts. */
export const catalogFlowRules: readonly Rule<FlowInput>[] = [
  flow001,
  flow003,
  flow005,
  flow006,
  flow007,
  flow014,
  flow015,
  flow019,
  flow021,
  flow023,
  flow025,
];

export const catalogRules: readonly Rule<CatalogInput>[] = [cat001, cat002];

export const validateCatalog = (catalog: Catalog, scope: Scope): Issue[] => [
  ...runRules(catalogFlowRules, { flows: catalogAsFlows(catalog), scope }),
  ...runRules(catalogRules, { catalog, scope }),
];
