import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Scope } from '../../01scope/schema';
import type { Catalog } from '../../02catalog/schema';
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
import { rule as flow025 } from '../../rules/flow-025-signed-out';
import { rule as flow026 } from '../../rules/flow-026-alternative-path';
import type { FlowInput } from '../../rules/helpers';
import type { Flows } from '../../schema';
import type { FlowBatch } from '../schema';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

/** Rules that hold within a flow, for one expansion call. */
export const batchRules: readonly Rule<FlowInput>[] = [
  flow001,
  flow002,
  flow003,
  flow004,
  flow005,
  flow006,
  flow007,
  flow008,
  flow011,
  flow012,
  flow013,
  flow016,
  flow019,
  flow020,
  flow021,
  flow025,
  flow026,
];

/** Every rule, for the assembled document; `weave validate` runs them. */
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
  flow025,
  flow026,
];

/** One call's flows with the whole catalog behind it, so references resolve: the catalog's parts plus the ones it added. */
export const batchAsFlows = (batch: FlowBatch, catalog: Catalog): Flows => ({
  flows: batch.flows,
  fields: [...catalog.fields, ...batch.newFields],
  forms: [...catalog.forms, ...batch.newForms],
  assumptions: catalog.assumptions,
  questions: catalog.questions,
});

export const validateBatch = (
  batch: FlowBatch,
  catalog: Catalog,
  scope: Scope,
): Issue[] =>
  runRules(batchRules, { flows: batchAsFlows(batch, catalog), scope });

export const validateFlows = (flows: Flows, scope: Scope): Issue[] =>
  runRules(flowRules, { flows, scope });
