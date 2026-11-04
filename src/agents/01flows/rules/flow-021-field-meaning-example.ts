/**
 * FLOW-021 · warning
 * Every catalog field has a meaning and an example.
 * Pass: { id: 'FD03', label: 'Title', meaning: 'The title as printed on the book.', example: 'Dune' }
 * Fail: { id: 'FD03', meaning: '', example: 'Dune' }
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-021',
  'warning',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    flows.fields.forEach((field, i) => {
      const missing = (['meaning', 'example'] as const).filter(
        (key) => field[key].trim() === '',
      );
      if (missing.length > 0) {
        issues.push(
          fail(
            `Field ${field.id} (${field.label}) has no ${missing.join(' or ')}; say what the value means and give a realistic example.`,
            `fields[${i}]`,
          ),
        );
      }
    });
    return issues;
  },
);
