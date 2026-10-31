import type { Issue } from '../../../../core/issues';
import { issue, type Rule, runRules } from '../../../../core/rules';
import type { Theme } from '../../02theme/build';
import type { Defined } from '../../04catalog/process';
import { skeleton } from '../../09assemble/skeleton/skeleton';
import { validateLayout } from '../../09assemble/validation/validation';
import { type AlonePage, widgetPage } from '../../09assemble/widget-page';
import { rule as design011 } from '../../rules/design-011-states';
import { rule as design015 } from '../../rules/design-015-headings';
import { widgetRule as design030 } from '../../rules/design-030-heading-plan';
import { widgetRule as design032 } from '../../rules/design-032-widget-serves';
import { widgetRule as design033 } from '../../rules/design-033-widget-states';
import { rule as design042 } from '../../rules/design-042-shape-box';
import { rule as design044 } from '../../rules/design-044-slots-drawn';
import type { DesignContext, WidgetInput } from '../../rules/helpers';
import type { NewComponent } from '../../schema';
import { nodeRules } from '../../rules/index';
import type { Build, ModelNode } from '../schema';

// A draw call's checks (DS23): the widget's own rules, the node rules on it
// alone, and the layout rules inside it, solved at its narrowest and widest.

/** Rules on one widget's build against its definition. */
export const widgetRules: readonly Rule<WidgetInput>[] = [design030, design032, design033, design044];

/** The node rules that hold for a widget alone; a screen's states and headings are DESIGN-033's and 030's there. */
export const widgetNodeRules = nodeRules.filter(
  (rule) => rule !== design011 && rule !== design015,
);

/**
 * The node rules and the layout rules on nodes alone, at `widths`, keeping
 * the issues inside them; LAYOUT-070 waits for assembly, which knows what
 * comes first on a page.
 */
export function aloneChecks(
  id: string,
  nodes: ModelNode[],
  layout: Parameters<typeof widgetPage>[2],
  on: AlonePage,
  widths: number[],
  ctx: DesignContext,
  theme: Theme,
): Issue[] {
  const seen = new Set<string>();
  return [...new Set(widths)].flatMap((width) => {
    const page = widgetPage(id, nodes, layout, on, width, theme);
    const { nodes: own, shells: _s, containers: _c, boxes: _b, frameChanges: _f, ...ia } = page;
    const inside = new Set([...own.map((n) => n.id), `${id}.sec1`]);
    return [
      ...runRules(widgetNodeRules, { nodes: own, ia, ctx, screen: id }),
      ...validateLayout(page, skeleton(page, ctx.inventory), ctx.inventory).filter(
        (i) => i.at !== undefined && inside.has(i.at) && i.rule !== 'LAYOUT-070',
      ),
      ...runRules([design042], { nodes }),
    ].filter((i) => {
      const key = `${i.rule}|${i.at}|${i.message}`;
      return seen.has(key) ? false : (seen.add(key), true);
    });
  });
}

/** One draw call's build of one widget: its own rules and the checks on it alone at its narrowest and widest, among the declared `components`. */
export function validateWidget(
  build: Build,
  widget: Defined,
  kind: 'app' | 'marketing',
  components: NewComponent[],
  ctx: DesignContext,
  theme: Theme,
): Issue[] {
  return [
    ...runRules(widgetRules, { build, widget, ctx }),
    ...aloneChecks(
      widget.id,
      build.nodes,
      build.layout,
      { kind, section: widget.kind, components },
      [widget.minWidthPx, widget.maxWidthPx],
      ctx,
      theme,
    ),
  ];
}

/** One draw call's answer: the widget it was given, built and checked. */
export function validateDrawn(
  build: Build,
  widget: Defined,
  kind: 'app' | 'marketing',
  components: NewComponent[],
  ctx: DesignContext,
  theme: Theme,
): Issue[] {
  return build.widget === widget.id
    ? validateWidget(build, widget, kind, components, ctx, theme)
    : [issue('DESIGN-029', 'mandatory', `The answer builds ${build.widget}, but this call builds ${widget.id}. The answer builds only the widget this call was given. Set widget to ${widget.id}, and build ${widget.id}.`, build.widget)];
}
