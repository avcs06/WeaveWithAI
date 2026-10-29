/**
 * FLOW-007 · mandatory
 * Every id a step or form refers to exists in the catalog: field ids, the step's form, the step's subflow, a form's fields. A subflow step never runs another subflow.
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
    const subflowIds = new Set(flows.subflows.map((subflow) => subflow.id));
    flows.forms.forEach((form, i) => {
      for (const id of form.fields.filter((id) => !fieldIds.has(id))) {
        issues.push(
          fail(
            `Form ${form.id} lists field ${id}, which is not in the catalog; define it in fields or fix the id.`,
            `forms[${i}]`,
          ),
        );
      }
    });
    for (const { container, step } of eachStep(flows)) {
      for (const id of step.fields.filter((id) => !fieldIds.has(id))) {
        issues.push(
          fail(
            `${step.id} asks for field ${id}, which is not in the catalog; define it in fields or fix the id.`,
            step.id,
          ),
        );
      }
      if (step.form !== '' && !formIds.has(step.form)) {
        issues.push(
          fail(
            `${step.id} uses form ${step.form}, which is not in the catalog; define it in forms or fix the id.`,
            step.id,
          ),
        );
      }
      if (step.subflow !== '') {
        if (!subflowIds.has(step.subflow)) {
          issues.push(
            fail(
              `${step.id} runs subflow ${step.subflow}, which is not in the catalog; define it in subflows or fix the id.`,
              step.id,
            ),
          );
        } else if (subflowIds.has(container.id)) {
          issues.push(
            fail(
              `${step.id} runs subflow ${step.subflow} from inside subflow ${container.id}; subflows do not nest.`,
              step.id,
            ),
          );
        }
      }
    }
    return issues;
  },
);
