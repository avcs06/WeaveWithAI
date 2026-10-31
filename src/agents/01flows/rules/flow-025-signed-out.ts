/**
 * FLOW-025 · mandatory
 * Signing up and signing in happen signed out, and so does every flow of a role that never signs in; signing out starts signed in.
 * Pass: F01 { authKind: 'signUp', signedOut: true }, F06 { authKind: 'signOut', signedOut: false }
 * Fail: F02 { authKind: 'signIn', signedOut: false }
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-025',
  'mandatory',
  ({ flows, scope }, fail) => {
    const neverSignsIn = new Set(
      scope.roles.filter((role) => !role.signedIn).map((role) => role.id),
    );
    const issues: Issue[] = [];
    for (const flow of flows.flows) {
      const why =
        flow.authKind === 'signUp'
          ? 'signs the user up'
          : flow.authKind === 'signIn'
            ? 'signs the user in'
            : neverSignsIn.has(flow.role)
              ? `belongs to ${flow.role}, a role that never signs in`
              : '';
      if (why && !flow.signedOut)
        issues.push(
          fail(
            `${flow.id} ${why}, so it happens signed out; set signedOut to true.`,
            flow.id,
          ),
        );
      if (flow.authKind === 'signOut' && flow.signedOut)
        issues.push(
          fail(
            `${flow.id} signs the user out, so it starts signed in; set signedOut to false.`,
            flow.id,
          ),
        );
    }
    return issues;
  },
);
