/**
 * FLOW-003 · mandatory
 * A flow's role is a role id from the scope.
 * Pass: role: 'reader' when scope.roles has { id: 'reader' }
 * Fail: role: 'librarian'
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-003',
  'mandatory',
  ({ flows, scope }, fail) => {
    const issues: Issue[] = [];
    const roleIds = scope.roles.map((role) => role.id);
    for (const flow of flows.flows) {
      if (!roleIds.includes(flow.role)) {
        issues.push(
          fail(
            `${flow.id} has role "${flow.role}", which is not in the scope; use one of ${roleIds.join(', ')}.`,
            flow.id,
          ),
        );
      }
    }
    return issues;
  },
);
