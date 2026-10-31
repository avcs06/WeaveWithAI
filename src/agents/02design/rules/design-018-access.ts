import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { IaInput } from './helpers';

/**
 * DESIGN-018 · mandatory
 * A screen serving a flow of a signed-in role is signedIn, and so are the
 * navigation items to it; signing up and signing in happen signed out. Both
 * ways: a screen whose flows all happen signed out (signing up, signing in,
 * or a role that never signs in) is public.
 * Pass: the shelf, signedIn, behind a signedIn Shelf item; sign in public.
 * Fail: the shelf public, or sign in signedIn.
 */
export const rule = defineRule<IaInput>(
  'DESIGN-018',
  'mandatory',
  ({ ia, ctx }, fail) => {
    const issues: Issue[] = [];
    const signedInRoles = new Set(
      ctx.scope.roles.filter((r) => r.signedIn).map((r) => r.id),
    );
    const signedInFlows = new Set(
      ctx.flows.flows
        .filter(
          (f) =>
            signedInRoles.has(f.role) &&
            f.authKind !== 'signUp' &&
            f.authKind !== 'signIn',
        )
        .map((f) => f.id),
    );
    const signedOutFlows = new Set(
      ctx.flows.flows
        .filter(
          (f) =>
            !signedInRoles.has(f.role) ||
            f.authKind === 'signUp' ||
            f.authKind === 'signIn',
        )
        .map((f) => f.id),
    );
    const flowsOf = (screen: { flowSteps: string[] }) =>
      screen.flowSteps
        .map((step) => step.split('.')[0] ?? '')
        .filter((flow) => signedInFlows.has(flow) || signedOutFlows.has(flow));
    for (const screen of ia.screens) {
      const flows = flowsOf(screen);
      if (
        screen.access !== 'public' &&
        flows.length &&
        flows.every((flow) => signedOutFlows.has(flow))
      )
        issues.push(
          fail(
            `${screen.id} serves only flows that happen signed out (${[...new Set(flows)].join(', ')}) but is ${screen.access}; make it public.`,
            screen.id,
          ),
        );
    }
    const needs = new Set(
      ia.screens
        .filter((s) =>
          s.flowSteps.some((step) =>
            signedInFlows.has(step.split('.')[0] ?? ''),
          ),
        )
        .map((s) => s.id),
    );
    for (const screen of ia.screens)
      if (needs.has(screen.id) && screen.access !== 'signedIn')
        issues.push(
          fail(
            `${screen.id} serves flows of signed-in roles but is ${screen.access}; make it signedIn.`,
            screen.id,
          ),
        );
    for (const item of ia.navigation.items) {
      const target = ia.screens.find((s) => s.id === item.screen);
      if (target?.access === 'signedIn' && item.access !== 'signedIn')
        issues.push(
          fail(
            `The navigation item ${item.label} leads to the signedIn ${item.screen} but is ${item.access}; make it signedIn.`,
            item.screen,
          ),
        );
    }
    return issues;
  },
);
