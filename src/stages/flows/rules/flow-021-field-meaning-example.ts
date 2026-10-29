/**
 * FLOW-021 · warning
 * Every field has a meaning and an example.
 * Pass: { name: 'title', meaning: 'The title as printed on the book.', example: 'Dune' }
 * Fail: { name: 'title', meaning: '', example: 'Dune' }
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>('FLOW-021', 'warning', ({ flows }, fail) => {
  const issues: Issue[] = [];
  for (const { step } of eachStep(flows)) {
    for (const field of step.fields) {
      const missing = (['meaning', 'example'] as const).filter((key) => field[key].trim() === '');
      if (missing.length > 0) {
        issues.push(fail(`Field "${field.name}" at ${step.id} has no ${missing.join(' or ')}; say what the value means and give a realistic example.`, step.id));
      }
    }
  }
  return issues;
});
