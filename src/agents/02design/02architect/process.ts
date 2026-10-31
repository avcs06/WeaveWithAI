import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import { DIALOG_GAP, type STATES } from '../config';
import type { Ia } from '../schema';
import { requiredStates } from '../rules/helpers';
import type { Plan, PlanScreen } from './schema';

// What follows from the architect's steps (DS23, DR05): a screen's access and
// roles from its flows, the states its steps require, and each alternative on
// the screen of the step it branches from. One right answer each, so code
// fills them before the rules run. A subflow's step or alternative belongs to
// the flows that call it.

type State = (typeof STATES)[number];

/** A planned screen with what follows from its steps; `flowSteps` holds its steps and alternatives. */
export type Planned = Omit<PlanScreen, 'states'> & {
  access: 'public' | 'signedIn';
  roles: string[];
  states: State[];
};

/** The plan with every screen filled in, and each navigation item with its page's title and access. */
export type Processed = Omit<Plan, 'screens' | 'navigation'> & {
  screens: Planned[];
  navigation: {
    screen: string;
    slot: string;
    label: string;
    access: 'public' | 'signedIn';
  }[];
};

export function processPlan(plan: Plan, flows: Flows, scope: Scope): Processed {
  const flowOf = new Map(
    [...flows.flows].map((flow) => [flow.id, flow] as const),
  );
  const alternatives = [
    ...flows.flows.flatMap((f) => f.alternatives),
    ...flows.subflows.flatMap((s) => s.alternatives),
  ];
  const elsewhere = new Map(
    plan.alternativesElsewhere.map((a) => [a.alternative, a.screen]),
  );
  const serving = (step: string) =>
    plan.screens.filter((s) => s.flowSteps.includes(step)).map((s) => s.id);
  const placed = new Map<string, string[]>();
  for (const alternative of alternatives) {
    const screens = elsewhere.has(alternative.id)
      ? [elsewhere.get(alternative.id) ?? '']
      : serving(alternative.from);
    for (const screen of screens)
      placed.set(screen, [...(placed.get(screen) ?? []), alternative.id]);
  }
  const callers = new Map<string, string[]>();
  for (const flow of flows.flows)
    for (const step of flow.steps)
      if (step.subflow) callers.set(step.subflow, [...(callers.get(step.subflow) ?? []), flow.id]);
  const roleIds = new Set(scope.roles.map((role) => role.id));
  const screens = plan.screens.map((screen): Planned => {
    const flowSteps = [
      ...new Set([...screen.flowSteps, ...(placed.get(screen.id) ?? [])]),
    ];
    const flowIds = new Set(
      flowSteps.flatMap((id) => {
        const owner = id.split('.')[0] ?? '';
        return flowOf.has(owner) ? [owner] : (callers.get(owner) ?? []);
      }),
    );
    const served = [...flowIds].flatMap((id) => flowOf.get(id) ?? []);
    const states = new Set<State>([
      ...requiredStates(flowSteps, flows),
      ...screen.states,
    ]);
    return {
      ...screen,
      flowSteps,
      access: served.some((flow) => !flow.signedOut) ? 'signedIn' : 'public',
      roles: [...new Set(served.map((flow) => flow.role))].filter((role) =>
        roleIds.has(role),
      ),
      states: [...states],
    };
  });
  const byId = new Map(screens.map((s) => [s.id, s]));
  return {
    ...plan,
    screens,
    navigation: plan.navigation.map((item) => ({
      ...item,
      label: byId.get(item.screen)?.title ?? '',
      access: byId.get(item.screen)?.access ?? 'public',
    })),
  };
}

const STACK = {
  direction: 'column',
  gap: '0',
  padding: '0',
  columns: 0,
  align: 'stretch',
  justify: 'start',
  wrap: false,
} as const;

/**
 * The processed plan in the shape the IA and node rules read: its screens,
 * with a dialog's own gap and a page's left to its layout, and its declared
 * components with no design yet.
 */
export function planAsIa(plan: Processed): Ia {
  return {
    navigation: {
      items: plan.navigation.map(({ label, screen, access }) => ({ label, screen, access })),
    },
    screens: plan.screens.map(({ title: _t, composition: _c, frame: _f, ...screen }) => ({
      ...screen,
      layout: {
        ...STACK,
        gap: screen.type === 'page' ? '' : DIALOG_GAP,
        padding: screen.type === 'page' ? '' : '0',
      },
    })),
    sections: [],
    newComponents: plan.newComponents.map((c) => ({
      ...c,
      minWidthPx: 0,
      maxWidthPx: 0,
      box: { width: 'content', widthPx: 0, height: 'content', heightPx: 0, minHeightPx: 0, padding: '0', gap: '0' },
      layout: STACK,
      nodes: [],
      usedOn: [],
    })),
    questions: plan.questions,
    impossibleSteps: plan.impossibleSteps,
  };
}
