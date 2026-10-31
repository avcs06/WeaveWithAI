import type { Issue } from '../../../../core/issues';
import { duplicates, issue, type Rule, runRules } from '../../../../core/rules';
import type { Theme } from '../../02theme/build';
import type { WidgetIa } from '../../03architect/schema';
import { skeleton } from '../../09assemble/skeleton/skeleton';
import { validateLayout } from '../../09assemble/validation/validation';
import { widgetPage } from '../../09assemble/widget-page';
import { rule as design011 } from '../../rules/design-011-states';
import { rule as design015 } from '../../rules/design-015-headings';
import { widgetRule as design028Widget } from '../../rules/design-028-copy';
import { widgetRule as design030Widget } from '../../rules/design-030-heading-plan';
import { widgetRule as design032 } from '../../rules/design-032-widget-serves';
import { widgetRule as design033 } from '../../rules/design-033-widget-states';
import {
  type DesignContext,
  placementsOf,
  type WidgetInput,
} from '../../rules/helpers';
import { nodeRules } from '../../rules/index';
import type { Build, WidgetBatch } from '../schema';

// A widget call's checks (DS23): the widget's own rules, the node rules on it
// alone, and the layout rules inside it, solved on a page of its own.

/** Rules on one widget's build against its definition. */
export const widgetRules: readonly Rule<WidgetInput>[] = [
  design028Widget,
  design030Widget,
  design032,
  design033,
];

/** The node rules that hold for a widget alone; the screen's states and headings are DESIGN-033's and 030's there. */
export const widgetNodeRules = nodeRules.filter(
  (rule) => rule !== design011 && rule !== design015,
);

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
