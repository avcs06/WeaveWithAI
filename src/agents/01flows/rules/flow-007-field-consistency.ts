/**
 * FLOW-007 · mandatory
 * Every id a step or form refers to exists in the catalog: field ids, the step's form, a form's fields.
 * Pass: fields: [{ id: 'FD01' }], forms: [{ id: 'FM01', fields: ['FD01'] }], a step with form 'FM01' and fields []
 * Fail: a step with fields ['FD99'] · a step with form 'FM09' when no such form · a form listing 'FD42' with no such field
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-007',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    const fieldIds = new Set(flows.fields.map((field) => field.id));
    const formIds = new Set(flows.forms.map((form) => form.id));
    flows.forms.forEach((form, i) => {
      for (const id of form.fields.filter((id) => !fieldIds.has(id))) {
        issues.push(
          fail(
            `Form ${form.id} lists field ${id}, which no field defines; define that field or fix the id.`,
            `forms[${i}]`,
          ),
        );
      }
    });
    for (const { step } of eachStep(flows)) {
      for (const id of step.fields.filter((id) => !fieldIds.has(id))) {
        issues.push(
          fail(
            `${step.id} asks for field ${id}, which no field defines; define that field or fix the id.`,
            step.id,
          ),
        );
      }
      if (step.form !== '' && !formIds.has(step.form)) {
        issues.push(
          fail(
            `${step.id} uses form ${step.form}, which no form defines; define that form or fix the id.`,
            step.id,
          ),
        );
      }
    }
    return issues;
  },
);
