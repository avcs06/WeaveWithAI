// The widget design's checks (DS23): the IA call's, a component call's, a
// widget or frame call's on its own output, and the whole design once code
// has assembled the screens.
import type { Issue } from '../../core/issues';
import { duplicates, issue, type Rule, runRules } from '../../core/rules';
import { legacyIa } from './assemble';
import { copyText, designNode } from './widget-nodes';
import { skeleton } from './layout';
import { resolveScreens, SHELL_IDS, withDefaults } from './resolve';
import {
  rule as design004,
  declarationRule as design004Declared,
  designRule as design004Designed,
} from './rules/design-004-new-component-reasons';
import { rule as design011 } from './rules/design-011-states';
import { rule as design015 } from './rules/design-015-headings';
import {
  frameRule as design028Frame,
  iaRule as design028Ia,
  widgetRule as design028Widget,
} from './rules/design-028-copy';
import { iaRule as design029 } from './rules/design-029-composition';
import {
  iaRule as design030Ia,
  widgetRule as design030Widget,
} from './rules/design-030-heading-plan';
import { iaRule as design031 } from './rules/design-031-states-fields';
import { widgetRule as design032 } from './rules/design-032-widget-serves';
import { widgetRule as design033 } from './rules/design-033-widget-states';
import {
  type DesignContext,
  type FrameInput,
  placementsOf,
  type WidgetIaInput,
  type WidgetInput,
} from './rules/design-helpers';
import type { NewComponent, Screens } from './schema';
import type {
  Build,
  FrameBuild,
  Widget,
  WidgetBatch,
  WidgetIa,
} from './schema-widgets';
import type { Theme } from './theme';
import {
  iaRules,
  nodeRules,
  validateIa,
  validateLayout,
  validateScreenNodes,
  validateScreens,
} from './validate';

/** Rules on the widget IA itself: the copy deck, the composition, the heading plan, states and fields. */
export const widgetIaRules: readonly Rule<WidgetIaInput>[] = [
  design028Ia,
  design029,
  design030Ia,
  design031,
];
/** Rules on one widget's build against its definition. */
export const widgetRules: readonly Rule<WidgetInput>[] = [
  design028Widget,
  design030Widget,
  design032,
  design033,
];
export const frameRules: readonly Rule<FrameInput>[] = [design028Frame];
/** The node rules that hold for a widget alone; the screen's states and headings are DESIGN-033's and 030's there. */
export const widgetNodeRules = nodeRules.filter(
  (rule) => rule !== design011 && rule !== design015,
);
/** The IA rules on the widget IA's legacy shape; of a new component only its declaration, as its design is its own call's. */
const legacyIaRules = [
  ...iaRules.filter((rule) => rule !== design004),
  design004Declared,
];

/** The IA call's output: its own rules, and the older IA rules on the sections its placements make. */
export function validateWidgetIa(ia: WidgetIa, ctx: DesignContext): Issue[] {
  return [
    ...runRules(widgetIaRules, { ia, ctx }),
    ...runRules(legacyIaRules, { ia: legacyIa(ia), ctx }),
  ];
}

/** A component call's design of one declared component. */
export function validateComponent(
  component: NewComponent,
  ia: WidgetIa,
  ctx: DesignContext,
): Issue[] {
  return runRules([design004Designed], {
    ia: { ...legacyIa(ia), newComponents: [component] },
    ctx,
  });
}

/**
 * One widget alone, framed as on its first placement: the screen `W03` with
 * one section, `W03.sec1`, holding the widget's nodes under the ids its call
 * wrote, so every issue names what the call can see.
 */
export function widgetPage(
  build: Build,
  widget: Widget,
  ia: WidgetIa,
  theme: Theme,
): Screens {
  const placement = placementsOf(ia, widget.id)[0];
  const host = ia.screens.find((s) => s.id === placement?.screen);
  const section = `${widget.id}.sec1`;
  const page: WidgetIa = {
    ...ia,
    screens: host
      ? [
          {
            ...host,
            id: widget.id,
            entry: false,
            arrangement: placement?.area === 'side' ? 'main-side' : 'column',
          },
        ]
      : [],
    widgets: [widget],
    placements: placement
      ? [{ ...placement, id: section, screen: widget.id, order: 1 }]
      : [],
  };
  const text = copyText([...ia.copy, ...build.copy]);
  const nodes = build.nodes.map((node) =>
    designNode(
      node,
      { id: node.id, section, parent: node.parent },
      host?.kind ?? 'app',
      text,
    ),
  );
  return resolveScreens(
    legacyIa(page, new Map(), new Map([[widget.id, build.layout]])),
    nodes,
    theme,
  );
}

/** One widget call's build of one widget: its own rules, the node rules on it alone, and the layout rules inside it. */
export function validateWidget(
  build: Build,
  ia: WidgetIa,
  ctx: DesignContext,
  theme: Theme,
): Issue[] {
  const widget = ia.widgets.find((w) => w.id === build.widget);
  if (!widget)
    return [
      issue(
        'DESIGN-029',
        'mandatory',
        `${build.widget} is not a widget of the IA; build only the widgets you were given.`,
        build.widget,
      ),
    ];
  const page = widgetPage(build, widget, ia, theme);
  const { nodes, shells: _shells, containers: _containers, ...own } = page;
  const inside = new Set([
    ...nodes.map((node) => node.id),
    `${widget.id}.sec1`,
  ]);
  // Alone, every widget starts its page; only the first on its screen meets an overlay header there.
  const placement = placementsOf(ia, widget.id)[0];
  const first = !ia.placements.some(
    (p) => p.screen === placement?.screen && p.order < placement.order,
  );
  const applies = (i: Issue) =>
    i.at !== undefined &&
    inside.has(i.at) &&
    (first || i.rule !== 'LAYOUT-070');
  return [
    ...runRules(widgetRules, { build, widget, ia, ctx }),
    ...runRules(widgetNodeRules, { nodes, ia: own, ctx, screen: widget.id }),
    ...validateLayout(
      page,
      skeleton(page, ctx.inventory),
      ctx.inventory,
    ).filter(applies),
  ];
}

/** One widget call's answer: each widget it was given built once, and each build checked. */
export function validateBatch(
  batch: WidgetBatch,
  ids: string[],
  ia: WidgetIa,
  ctx: DesignContext,
  theme: Theme,
): Issue[] {
  const fail = (message: string, at: string) =>
    issue('DESIGN-029', 'mandatory', message, at);
  const built = batch.widgets.map((b) => b.widget);
  return [
    ...ids
      .filter((id) => !built.includes(id))
      .map((id) =>
        fail(`${id} is not built; build each widget you were given once.`, id),
      ),
    ...duplicates(batch.widgets, (b) => b.widget).map((id) =>
      fail(`${id} is built twice; build it once.`, id),
    ),
    ...batch.widgets.flatMap((b) =>
      ids.includes(b.widget)
        ? validateWidget(b, ia, ctx, theme)
        : [
            fail(
              `${b.widget} is not one of ${ids.join(' and ')}; build only those.`,
              b.widget,
            ),
          ],
    ),
  ];
}

/** One frame call's nodes for a shell: the copy rule and the node rules. */
export function validateFrame(
  frame: FrameBuild,
  ia: WidgetIa,
  ctx: DesignContext,
  theme: Theme,
): Issue[] {
  const text = copyText([...ia.copy, ...frame.copy]);
  const kind = frame.screen === SHELL_IDS.marketing ? 'marketing' : 'app';
  const nodes = frame.nodes.map((node) =>
    designNode(
      node,
      { id: node.id, section: node.section, parent: node.parent },
      kind,
      text,
    ),
  );
  return [
    ...runRules(frameRules, { frame, ia, ctx }),
    ...validateScreenNodes(
      frame.screen,
      withDefaults(nodes, theme),
      legacyIa(ia),
      ctx,
    ),
  ];
}

/** The assembled design: the IA, each screen's and shell's nodes, the whole artifact and its solved layout. */
export function validateDesign(
  screens: Screens,
  solved: ReturnType<typeof skeleton>,
  ctx: DesignContext,
): Issue[] {
  const { nodes, shells, containers: _containers, ...ia } = screens;
  const owner = (section: string) =>
    ia.sections.find((s) => s.id === section)?.screen ??
    shells.find((shell) => shell.regions.some((r) => r.id === section))?.id;
  return [
    ...validateIa(ia, ctx),
    ...[...ia.screens, ...shells].flatMap(({ id }) =>
      validateScreenNodes(
        id,
        nodes.filter((node) => owner(node.section) === id),
        ia,
        ctx,
      ),
    ),
    ...validateScreens(screens, ctx),
    ...validateLayout(screens, solved, ctx.inventory),
  ];
}
