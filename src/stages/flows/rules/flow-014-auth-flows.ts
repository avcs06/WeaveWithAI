/**
 * FLOW-014 · mandatory
 * When any role has signedIn: true, flows with authKind signUp, signIn and signOut all exist. Nothing is checked when no role signs in.
 * Pass: F01 { authKind: 'signUp' }, F02 { authKind: 'signIn' }, F06 { authKind: 'signOut' }
 * Fail: a signed-in role and no flow with authKind 'signOut'
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

export const rule = defineRule<FlowInput>('FLOW-014', 'mandatory', ({ flows, scope }, fail) => {
  if (!scope.roles.some((role) => role.signedIn)) return [];
  const issues: Issue[] = [];
  const present = new Set(flows.flows.map((flow) => flow.authKind));
  for (const kind of ['signUp', 'signIn', 'signOut'] as const) {
    if (!present.has(kind)) {
      issues.push(fail(`A role signs in but no flow has authKind "${kind}"; add an auth flow for it.`, 'flows'));
    }
  }
  return issues;
});
