/**
 * FLOW-006 · mandatory
 * Catalog field ids are FD01, FD02, ... and unique; a step asks for each field once, its form's fields included.
 * Pass: fields: [{ id: 'FD01' }, { id: 'FD02' }]; a step with form FM01 (FD01, FD02) and fields ['FD03']
 * Fail: { id: 'title' } · 'FD01' twice in the catalog · a step with form FM01 (FD01, ...) and fields ['FD01']
 */
import type { Issue } from '../../../core/issues';
import { defineRule, duplicates } from '../../../core/rules';
import { eachStep, type FlowInput } from './helpers';

export const FIELD_ID = /^FD\d{2,}$/;

export const rule = defineRule<FlowInput>(
  'FLOW-006',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    flows.fields.forEach((field, i) => {
      if (!FIELD_ID.test(field.id)) {
        issues.push(
          fail(
            `Field id "${field.id}" is malformed; use FD01, FD02, ...`,
            `fields[${i}]`,
          ),
        );
      }
    });
    for (const id of duplicates(flows.fields, (field) => field.id)) {
      issues.push(
        fail(
          `Field id "${id}" is defined twice in the catalog; define each field once.`,
          'fields',
        ),
      );
    }
    for (const { step } of eachStep(flows)) {
      const form = flows.forms.find((candidate) => candidate.id === step.form);
      const ids = [...(form?.fields ?? []), ...step.fields].map((id) => ({
        id,
      }));
      for (const id of duplicates(ids, (item) => item.id)) {
        issues.push(
          fail(
            `Field ${id} appears twice at ${step.id}${form ? ` (once through form ${form.id})` : ''}; a step asks for each field once.`,
            step.id,
          ),
        );
      }
    }
    return issues;
  },
);
