/**
 * FLOW-015 · mandatory
 * Every role has at least one flow besides the auth flows.
 * Pass: reader has F03 { kind: 'create' }
 * Fail: reader has only F01 and F02, both { kind: 'auth' }
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-015',
  'mandatory',
  ({ flows, scope }, fail) => {
    const issues: Issue[] = [];
    for (const role of scope.roles) {
      const hasWork = flows.flows.some(
        (flow) => flow.role === role.id && flow.kind !== 'auth',
      );
      if (!hasWork) {
        issues.push(
          fail(
            `Role "${role.id}" has no flow besides signing up, in and out; add the flows that let a ${role.name} get something done.`,
            'flows',
          ),
        );
      }
    }
    return issues;
  },
);
