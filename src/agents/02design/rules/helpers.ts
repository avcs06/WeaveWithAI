import type { Inventory } from '../../../ds/inventory';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows, Step } from '../../01flows/schema';
import type { DesignNode, Ia, Screens } from '../schema';
import type { Shell } from '../schema-boxes';
import type { ComponentDefaults } from '../02theme/schema';
import type { Widget, WidgetIa } from '../03architect/schema';
import type { Build } from '../07draw/schema';
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
/** The widget IA (DS23): copy deck, widgets and placements. */
export type WidgetIaInput = { ia: WidgetIa; ctx: DesignContext };
/** One widget as its call built it, with the IA's definition of it. */
export type WidgetInput = {
  build: Build;
  widget: Widget;
  ia: WidgetIa;
  ctx: DesignContext;
};
/** One shell's nodes as its frame call wrote them. */
export type FrameInput = { frame: FrameBuild; ia: WidgetIa; ctx: DesignContext };

/** A widget's placements, in screen and reading order. */
export const placementsOf = (ia: WidgetIa, widget: string) =>
  ia.placements
    .filter((p) => p.widget === widget)
    .sort((a, b) => a.screen.localeCompare(b.screen) || a.order - b.order);

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

/** The screens a node shows on: its own, or every page that uses its shell. */
export function screensOf(screens: Screens, node: DesignNode): string[] {
  const owner = screenOf(node.id);
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
