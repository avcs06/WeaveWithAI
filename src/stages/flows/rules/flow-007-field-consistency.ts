/**
 * FLOW-007 · mandatory (a label difference alone is a warning)
 * A field name means one thing everywhere: the same type and the same options in every step that uses it.
 * Pass: 'shelf' is singleChoice with ['To read', 'Reading', 'Done'] in F03 and in F05
 * Fail: 'password' is type password in F01.S01 and type text in F02.S01
 * Warning: 'title' is labelled 'Title' in one step and 'Book title' in another
 */
import type { Issue } from '../../../core/issues';
import { defineRule, issue } from '../../../core/rules';
import type { Field } from '../schema';
import { eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-007',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    const first = new Map<string, { field: Field; at: string }>();
    for (const { step } of eachStep(flows)) {
      for (const field of step.fields) {
        const seen = first.get(field.name);
        if (!seen) {
          first.set(field.name, { field, at: step.id });
          continue;
        }
        const sameType = seen.field.type === field.type;
        const sameOptions =
          JSON.stringify(seen.field.options) === JSON.stringify(field.options);
        if (!sameType || !sameOptions) {
          issues.push(
            fail(
              `Field "${field.name}" at ${step.id} is ${describe(field)} but at ${seen.at} it is ${describe(seen.field)}; a name keeps one type and one option list everywhere.`,
              step.id,
            ),
          );
        } else if (seen.field.label !== field.label) {
          // Same meaning, different wording: worth a look, not a rerun.
          issues.push(
            issue(
              'FLOW-007',
              'warning',
              `Field "${field.name}" is labelled "${field.label}" at ${step.id} but "${seen.field.label}" at ${seen.at}; use one label.`,
              step.id,
            ),
          );
        }
      }
    }
    return issues;
  },
);

const describe = (field: Field): string =>
  field.options.length > 0
    ? `${field.type} with options [${field.options.join(', ')}]`
    : field.type;
