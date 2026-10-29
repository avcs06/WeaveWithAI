/**
 * FLOW-006 · mandatory
 * Field names are camelCase and unique within a step.
 * Pass: fields: [{ name: 'title' }, { name: 'dueDate' }]
 * Fail: { name: 'Author' } · 'title' listed twice in one step
 */
import type { Issue } from '../../../core/issues';
import { defineRule, duplicates, isCamel } from '../../../core/rules';
import { eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>('FLOW-006', 'mandatory', ({ flows }, fail) => {
  const issues: Issue[] = [];
  for (const { step } of eachStep(flows)) {
    for (const field of step.fields) {
      if (!isCamel(field.name)) {
        issues.push(fail(`Field name "${field.name}" at ${step.id} is not camelCase; write it like "dueDate".`, step.id));
      }
    }
    for (const name of duplicates(step.fields, (field) => field.name)) {
      issues.push(fail(`Field "${name}" appears twice at ${step.id}; a step lists each field once.`, step.id));
    }
  }
  return issues;
});
