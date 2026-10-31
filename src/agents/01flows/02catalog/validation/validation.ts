import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Scope } from '../../01scope/schema';
import { rule as flow001 } from '../../rules/flow-001-ids';
import { rule as flow002 } from '../../rules/flow-002-step-numbering';
import { rule as flow003 } from '../../rules/flow-003-role';
import { rule as flow004 } from '../../rules/flow-004-step-text';
import { rule as flow005 } from '../../rules/flow-005-choice-options';
import { rule as flow006 } from '../../rules/flow-006-field-names';
import { rule as flow007 } from '../../rules/flow-007-field-consistency';
import { rule as flow011 } from '../../rules/flow-011-form-alternatives';
import { rule as flow012 } from '../../rules/flow-012-empty-alternatives';
import { rule as flow013 } from '../../rules/flow-013-delete-alternatives';
import { rule as flow014 } from '../../rules/flow-014-auth-flows';
import { rule as flow015 } from '../../rules/flow-015-role-coverage';
import { rule as flow016 } from '../../rules/flow-016-alternative-steps';
import { rule as flow019 } from '../../rules/flow-019-outcome';
import { rule as flow020 } from '../../rules/flow-020-size';
import { rule as flow021 } from '../../rules/flow-021-field-meaning-example';
import { rule as flow023 } from '../../rules/flow-023-new-ids';
import {
  catalogAsFlows,
  type CatalogInput,
  type FlowInput,
} from '../../rules/helpers';
import type { Catalog } from '../schema';
import { rule as cat001 } from './rules/cat-001-descriptions';
import { rule as cat002 } from './rules/cat-002-forms';
import { rule as cat003 } from './rules/cat-003-subflows';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

/** The catalog has headers and subflow steps: the header rules, and the within-flow rules for the subflows. */
export const catalogFlowRules: readonly Rule<FlowInput>[] = [
  flow001,
  flow002,
  flow003,
  flow004,
  flow005,
  flow006,
  flow007,
  flow011,
  flow012,
  flow013,
  flow014,
  flow015,
  flow016,
  flow019,
  flow020,
  flow021,
  flow023,
];

export const catalogRules: readonly Rule<CatalogInput>[] = [
  cat001,
  cat002,
  cat003,
];

export const validateCatalog = (catalog: Catalog, scope: Scope): Issue[] => [
  ...runRules(catalogFlowRules, { flows: catalogAsFlows(catalog), scope }),
  ...runRules(catalogRules, { catalog, scope }),
];
