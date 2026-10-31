import type { Brief } from './01brief/schema';
import type { Theme } from './02theme/build';
import type { Layouts } from './02theme/schema';
import type { WidgetIa } from './03architect/schema';
import { placementsOf } from './rules/helpers';

// What the design calls after the IA are told about the app (DS23): the look,
// the screens a node can open, and where a widget is placed. A call gets what
// it builds from, not the whole flows.

export type Kind = keyof Layouts;

/** What the look of a call is: the brief's feel, the theme's defaults and each kind's content area. */
export const look = (brief: Brief, theme: Theme, kinds: Kind[]) => ({
  feel: brief.feel,
  personality: brief.personality,
  imagery: brief.imagery,
  defaults: theme.defaults,
  contentArea: Object.fromEntries(
    kinds.map((kind) => [kind, theme.layouts[kind].main]),
  ),
});

/** The screens a node can open. */
export const screenList = (ia: WidgetIa) =>
  ia.screens.map(({ id, name, type, kind, route, parent, access }) => ({
    id,
    name,
    type,
    kind,
    route,
    parent,
    access,
  }));

/** Where a widget is placed: each screen, its area, surface and level, and the widgets around it in reading order. */
export function placed(ia: WidgetIa, widget: string) {
  return placementsOf(ia, widget).map((p) => {
    const screen = ia.screens.find((s) => s.id === p.screen);
    const around = ia.placements
      .filter((o) => o.screen === p.screen)
      .sort((a, b) => a.order - b.order)
      .map((o) =>
        o.widget === widget
          ? `${o.widget} (this one)`
          : `${o.widget} ${ia.widgets.find((w) => w.id === o.widget)?.name ?? ''}`,
      );
    return {
      screen: screen && {
        id: screen.id,
        name: screen.name,
        type: screen.type,
        kind: screen.kind,
        contentWidth: screen.contentWidth,
        arrangement: screen.arrangement,
        framed: screen.framed,
      },
      area: p.area,
      surface: p.surface,
      headingLevel: p.headingLevel,
      around,
    };
  });
}
