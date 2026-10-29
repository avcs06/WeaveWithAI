// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.
import type { Issue } from '../../core/issues';
import { type Rule, runRules } from '../../core/rules';
import { rule as flow001 } from './rules/flow-001-ids';
import { rule as flow002 } from './rules/flow-002-step-numbering';
import { rule as flow003 } from './rules/flow-003-role';
import { rule as flow004 } from './rules/flow-004-step-text';
import { rule as flow005 } from './rules/flow-005-choice-options';
import { rule as flow006 } from './rules/flow-006-field-names';
import { rule as flow007 } from './rules/flow-007-field-consistency';
import { rule as flow008 } from './rules/flow-008-effect-nouns';
import { rule as flow009 } from './rules/flow-009-created-nouns-read';
import { rule as flow010 } from './rules/flow-010-created-nouns-managed';
import { rule as flow011 } from './rules/flow-011-form-alternatives';
import { rule as flow012 } from './rules/flow-012-empty-alternatives';
import { rule as flow013 } from './rules/flow-013-delete-alternatives';
import { rule as flow014 } from './rules/flow-014-auth-flows';
import { rule as flow015 } from './rules/flow-015-role-coverage';
import { rule as flow016 } from './rules/flow-016-alternative-steps';
import { rule as flow017 } from './rules/flow-017-technology-words';
import { rule as flow018 } from './rules/flow-018-layout-words';
import { rule as flow019 } from './rules/flow-019-outcome';
import { rule as flow020 } from './rules/flow-020-size';
import { rule as flow021 } from './rules/flow-021-field-meaning-example';
import { rule as flow022 } from './rules/flow-022-unsupported-mentions';
import { rule as flow023 } from './rules/flow-023-new-ids';
import type { FlowInput } from './rules/helpers';
import { rule as scope001 } from './rules/scope-001-roles';
import { rule as scope002 } from './rules/scope-002-vocabulary';
import { rule as scope003 } from './rules/scope-003-questions';
import { rule as scope004 } from './rules/scope-004-unsupported-capabilities';
import { rule as scope005 } from './rules/scope-005-ids';
import { rule as scope006 } from './rules/scope-006-summary-and-size';
import type { Flows, Scope } from './schema';

export const scopeRules: readonly Rule<Scope>[] = [scope001, scope002, scope003, scope004, scope005, scope006];

export const flowRules: readonly Rule<FlowInput>[] = [
  flow001, flow002, flow003, flow004, flow005, flow006, flow007, flow008, flow009, flow010, flow011, flow012,
  flow013, flow014, flow015, flow016, flow017, flow018, flow019, flow020, flow021, flow022, flow023,
];

export const validateScope = (scope: Scope): Issue[] => runRules(scopeRules, scope);
export const validateFlows = (flows: Flows, scope: Scope): Issue[] => runRules(flowRules, { flows, scope });
