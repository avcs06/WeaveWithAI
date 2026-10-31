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
import { rule as flow011 } from '../../rules/flow-011-form-alternatives';
import { rule as flow012 } from '../../rules/flow-012-empty-alternatives';
import { rule as flow013 } from '../../rules/flow-013-delete-alternatives';
import { rule as flow016 } from '../../rules/flow-016-alternative-steps';
import { rule as flow019 } from '../../rules/flow-019-outcome';
import { rule as flow021 } from '../../rules/flow-021-field-meaning-example';
import type { FlowInput } from '../../rules/helpers';
import type { Flows } from '../../schema';
import type { FlowBatch } from '../schema';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

/** Rules that hold within a flow, for one expansion batch; the cross-flow rules and the flow count wait for reconciliation. */
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
  flow021,
];

/** One batch with the whole catalog behind it, so references resolve: its flows, the catalog's parts plus the ones it added. */
export const batchAsFlows = (batch: FlowBatch, catalog: Catalog): Flows => ({
  flows: batch.flows,
  fields: [...catalog.fields, ...batch.newFields],
  forms: [...catalog.forms, ...batch.newForms],
  subflows: [...catalog.subflows, ...batch.newSubflows],
  assumptions: catalog.assumptions,
  questions: catalog.questions,
});

/**
 * A batch is checked with the whole catalog behind it, so references to its fields, forms and subflows resolve. The
 * catalog's subflows were validated when the catalog was written, so issues inside them were the catalog's to fix
 * and are left out here; a batch answers for its own flows and the parts it added.
 */
export const validateBatch = (
  batch: FlowBatch,
  catalog: Catalog,
  scope: Scope,
): Issue[] => {
  const catalogSubflows = new Set(
    catalog.subflows.map((subflow) => subflow.id),
  );
  const inCatalogSubflow = (issue: Issue) =>
    catalogSubflows.has(issue.at?.split('.')[0] ?? '');
  return runRules(batchRules, {
    flows: batchAsFlows(batch, catalog),
    scope,
  }).filter((issue) => !inCatalogSubflow(issue));
};
