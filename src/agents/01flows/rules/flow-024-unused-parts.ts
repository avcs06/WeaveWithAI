/**
 * FLOW-024 · warning
 * Every catalog field, form and subflow is used by some step (a field through a form counts).
 * Pass: field FD03 in form FM01, FM01 used by F03.S02; subflow STD01 run by F05.S02
 * Fail: a field FD06 no form or step asks for · a form no step uses · a subflow no step runs
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-024',
  'warning',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    const usedForms = new Set<string>();
    const usedSubflows = new Set<string>();
    const usedFields = new Set<string>();
    for (const { step } of eachStep(flows)) {
      if (step.form !== '') usedForms.add(step.form);
      if (step.subflow !== '') usedSubflows.add(step.subflow);
      for (const id of step.fields) usedFields.add(id);
    }
    for (const form of flows.forms) {
      if (usedForms.has(form.id))
        for (const id of form.fields) usedFields.add(id);
    }
    for (const field of flows.fields) {
      if (!usedFields.has(field.id))
        issues.push(
          fail(
            `Field ${field.id} (${field.label}) is defined but no step or form asks for it; use it or drop it.`,
            'fields',
          ),
        );
    }
    for (const form of flows.forms) {
      if (!usedForms.has(form.id))
        issues.push(
          fail(
            `Form ${form.id} is defined but no step uses it; use it or drop it.`,
            'forms',
          ),
        );
    }
    for (const subflow of flows.subflows) {
      if (!usedSubflows.has(subflow.id))
        issues.push(
          fail(
            `Subflow ${subflow.id} is defined but no step runs it; use it or drop it.`,
            'subflows',
          ),
        );
    }
    return issues;
  },
);
