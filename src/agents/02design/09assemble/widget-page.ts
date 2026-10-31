import type { Theme } from '../02theme/build';
import type { Widget, WidgetIa } from '../03architect/schema';
import type { Build } from '../07draw/schema';
import { placementsOf } from '../rules/helpers';
import type { Screens } from '../schema';
import { legacyIa } from './assemble';
import { copyText, designNode } from './nodes';
import { resolveScreens } from './resolve';

// One widget on a page of its own (DS23), for its call's layout check.

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
