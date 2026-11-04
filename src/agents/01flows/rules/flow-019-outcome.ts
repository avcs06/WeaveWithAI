/**
 * FLOW-019 · mandatory
 * Every flow has a non-empty outcome.
 * Pass: outcome: 'The book is on the shelf and still there after a refresh.'
 * Fail: outcome: ''
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-019',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const flow of flows.flows) {
      if (flow.outcome.trim() === '') {
        issues.push(
          fail(
            `${flow.id} has no outcome; say what changed and what is still there after a refresh.`,
            flow.id,
          ),
        );
      }
    }
    return issues;
  },
);
