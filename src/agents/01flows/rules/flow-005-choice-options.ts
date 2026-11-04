/**
 * FLOW-005 · mandatory
 * In the field catalog, singleChoice and multiChoice fields list at least 2 options unless `optionsFrom` names the
 * records they choose from; that name is a vocabulary noun. Every other type has options [].
 * Pass: { type: 'singleChoice', options: ['To read', 'Reading'], optionsFrom: '' } · { type: 'singleChoice', options: [], optionsFrom: 'Shelf' } · { type: 'text', options: [] }
 * Fail: { type: 'singleChoice', options: ['To read'], optionsFrom: '' } · { optionsFrom: 'Genre' } when the scope has no Genre · { type: 'text', options: ['a'] }
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

const CHOICE_TYPES = ['singleChoice', 'multiChoice'];

export const rule = defineRule<FlowInput>(
  'FLOW-005',
  'mandatory',
  ({ flows, scope }, fail) => {
    const issues: Issue[] = [];
    const nouns = scope.vocabulary.map((entry) => entry.noun);
    flows.fields.forEach((field, i) => {
      const isChoice = CHOICE_TYPES.includes(field.type);
      if (isChoice && field.optionsFrom === '' && field.options.length < 2) {
        issues.push(
          fail(
            `Field ${field.id} (${field.label}) is ${field.type} with ${field.options.length} options; list at least 2, or set optionsFrom to the vocabulary noun whose records are the choices.`,
            `fields[${i}]`,
          ),
        );
      }
      if (field.optionsFrom !== '' && !nouns.includes(field.optionsFrom)) {
        issues.push(
          fail(
            `Field ${field.id} (${field.label}) takes its options from "${field.optionsFrom}", which is not a vocabulary noun; use one of: ${nouns.join(', ')}.`,
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
