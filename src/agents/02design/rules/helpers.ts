import type { Inventory } from '../../../ds/inventory';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows, Step } from '../../01flows/schema';
import type { DesignNode, Ia, Screens } from '../schema';
import type { Shell } from '../schema-boxes';
import type { ComponentDefaults, Layouts } from '../02theme/schema';
import type { Processed as Plan, Planned } from '../03architect/process';
import type { Defined, Processed as Catalog } from '../04catalog/process';
import type { ScreenLayout } from '../05screen/schema';
import type { Build, ModelNode } from '../07draw/schema';
import type { FrameBuild } from '../08frame/schema';

// What the design rules (DESIGN-0NN, specs/design.md) read: the IA alone, one
// screen's or shell's nodes, or the whole screens artifact, with the flows,
// the scope, the full inventory, and the shells and component defaults from
// the theme.

export type DesignContext = {
  scope: Scope;
  flows: Flows;
  inventory: Inventory;
  shells: Shell[];
  defaults: ComponentDefaults;
};
export type IaInput = { ia: Ia; ctx: DesignContext };
/** One screen's or shell's nodes; `screen` is that screen's or shell's id. */
export type NodesInput = {
  nodes: DesignNode[];
  ia: Ia;
  ctx: DesignContext;
  screen: string;
};
export type ScreensInput = { screens: Screens; ctx: DesignContext };
/** The architect's processed plan (DS23), with the theme's page layouts its navigation fits. */
export type PlanInput = { plan: Plan; layouts: Layouts; ctx: DesignContext };
/** The catalog's processed definitions, with the plan they serve and each screen's content width. */
export type CatalogInput = {
  catalog: Catalog;
  plan: Plan;
  ctx: DesignContext;
  widthOf: (screen: string) => number;
};
/** One screen's layout, with its planned screen, the catalog and its content width. */
export type ScreenInput = {
  layout: ScreenLayout;
  screen: Planned;
  catalog: Catalog;
  ctx: DesignContext;
  width: number;
  gapPx: number;
};
/** One widget as its call built it, with the catalog's definition of it. */
export type WidgetInput = { build: Build; widget: Defined; ctx: DesignContext };
/** A component's root box as invent drew it, with the width range catalog gave it. */
export type ComponentInput = {
  name: string;
  box: { width: string; widthPx: number };
  range: { minWidthPx: number; maxWidthPx: number };
};
/** A call's nodes as written: a widget's, a component's or a frame's. */
export type ModelNodesInput = { nodes: ModelNode[] };
/** One shell's nodes as its frame call wrote them, with the steps catalog gave the frame. */
export type FrameInput = {
  frame: FrameBuild;
  plan: Plan;
  frameSteps: string[];
  ctx: DesignContext;
};

export const INTERACTIVE = new Set([
  'primary-action',
  'secondary-action',
  'destructive-action',
  'navigation',
  'input',
]);
export const ACTIONS = new Set([
  'primary-action',
  'secondary-action',
  'destructive-action',
]);

/** The screen an id belongs to: `S03` of `S03.sec2` or `S03.n07`; the shell `SH1` of `SH1.n01`. */
export const screenOf = (id: string) => id.split('.')[0] ?? '';

/** The screens a node shows on: its own, every page that uses its shell, or the one page a frame change adds it to. */
export function screensOf(screens: Screens, node: DesignNode): string[] {
  const [owner = '', changed] = node.id.split('.');
  // A frame change's node, SH1.S04.n01, shows on S04 alone.
  if (changed && /^S\d{2}$/.test(changed)) return [changed];
  return screens.shells.some((shell) => shell.id === owner)
    ? screens.screens.filter((s) => s.shell === owner).map((s) => s.id)
    : [owner];
}

/** Every step of the flows and their subflows, with the flow's role and auth kind. */
export function steps(
  flows: Flows,
): (Step & { role: string; authKind: string })[] {
  return [
    ...flows.flows.flatMap((flow) =>
      flow.steps.map((step) => ({
        ...step,
        role: flow.role,
        authKind: flow.authKind,
      })),
    ),
    ...flows.subflows.flatMap((subflow) =>
      subflow.steps.map((step) => ({ ...step, role: '', authKind: 'none' })),
    ),
  ];
}

/** Every step and alternative id. */
export function stepIds(flows: Flows): string[] {
  return [
    ...flows.flows.flatMap((flow) =>
      [...flow.steps, ...flow.alternatives].map((s) => s.id),
    ),
    ...flows.subflows.flatMap((subflow) =>
      [...subflow.steps, ...subflow.alternatives].map((s) => s.id),
    ),
  ];
}

/** A step's fields, its form's included. */
export function stepFields(flows: Flows, step: Step): string[] {
  const form = flows.forms.find((f) => f.id === step.form);
  return [...step.fields, ...(form?.fields ?? [])];
}

/** One screen's nodes in reading order: sections by order, then each tree depth first. */
export function readingOrder(
  ia: Ia,
  nodes: DesignNode[],
  screen: string,
): DesignNode[] {
  const byOrder = <T extends { order: number; id: string }>(a: T, b: T) =>
    a.order - b.order || a.id.localeCompare(b.id);
  const out: DesignNode[] = [];
  const seen = new Set<string>();
  const walk = (section: string, parent: string) => {
    for (const node of nodes
      .filter((n) => n.section === section && n.parent === parent)
      .sort(byOrder)) {
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      out.push(node);
      walk(section, node.id);
    }
  };
  for (const section of ia.sections
    .filter((s) => s.screen === screen)
    .sort(byOrder))
    walk(section.id, '');
  return out;
}

type State = (typeof import('../config').STATES)[number];

/** The state an alternative of a kind shows where it is served. */
const ALTERNATIVE_STATE: Partial<Record<string, State>> = {
  failure: 'error',
  empty: 'empty',
  denied: 'denied',
  notFound: 'notFound',
};

/**
 * The states what serves these steps and alternatives must show (DR05, DR08):
 * listing records needs empty and error, and an alternative shows its own
 * state. Loading is the design system's, and saving fields needs none: a
 * field's error and the submit's progress are the design system's, and the
 * result, failure or denial included, is a toast (user, 2026-10-31).
 */
export function requiredStates(ids: string[], flows: Flows): State[] {
  const byStep = new Map(steps(flows).map((step) => [step.id, step]));
  const alternatives = new Map(
    [
      ...flows.flows.flatMap((f) => f.alternatives),
      ...flows.subflows.flatMap((s) => s.alternatives),
    ].map((a) => [a.id, a]),
  );
  const saves = (id: string) => {
    const step = byStep.get(id);
    return step?.kind === 'user' && stepFields(flows, step).length > 0;
  };
  const own = ids.flatMap((id) => byStep.get(id) ?? []);
  const states = new Set<State>();
  if (own.some((step) => step.effects.some((e) => e.change === 'list')))
    for (const state of ['empty', 'error'] as const) states.add(state);
  for (const id of ids) {
    const alternative = alternatives.get(id);
    if (!alternative || saves(alternative.from)) continue;
    const state = ALTERNATIVE_STATE[alternative.kind];
    if (state) states.add(state);
  }
  return [...states];
}
