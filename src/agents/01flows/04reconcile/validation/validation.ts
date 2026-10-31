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
import { rule as flow008 } from '../../rules/flow-008-effect-nouns';
import { rule as flow009 } from '../../rules/flow-009-created-nouns-read';
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
import { rule as flow024 } from '../../rules/flow-024-unused-parts';
import type { FlowInput } from '../../rules/helpers';
import type { Flows } from '../../schema';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

export const flowRules: readonly Rule<FlowInput>[] = [
  flow001,
  flow002,
  flow003,
  flow004,
  flow005,
  flow006,
  flow007,
  flow008,
  flow009,
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
  flow024,
];

export const validateFlows = (flows: Flows, scope: Scope): Issue[] =>
  runRules(flowRules, { flows, scope });
