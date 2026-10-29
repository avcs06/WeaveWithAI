/**
 * FLOW-005 · mandatory
 * In the field catalog, singleChoice and multiChoice fields list at least 2 options; every other type has options [].
 * Pass: { type: 'singleChoice', options: ['To read', 'Reading'] } · { type: 'text', options: [] }
 * Fail: { type: 'singleChoice', options: ['To read'] } · { type: 'text', options: ['a'] }
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

const CHOICE_TYPES = ['singleChoice', 'multiChoice'];

export const rule = defineRule<FlowInput>(
  'FLOW-005',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    flows.fields.forEach((field, i) => {
      const isChoice = CHOICE_TYPES.includes(field.type);
      if (isChoice && field.options.length < 2) {
        issues.push(
          fail(
            `Field ${field.id} (${field.label}) is ${field.type} with ${field.options.length} options; list at least 2.`,
            `fields[${i}]`,
          ),
        );
      }
      if (!isChoice && field.options.length > 0) {
        issues.push(
          fail(
            `Field ${field.id} (${field.label}) is ${field.type} but has options; only choice types have options.`,
            `fields[${i}]`,
          ),
        );
      }
    });
    return issues;
  },
);
