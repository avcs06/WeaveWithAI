import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { Rect } from '../../skeleton/skeleton';
import type { LayoutInput, View } from '../helpers';

/**
 * LAYOUT-046 · mandatory · H-46 Nothing wider than the viewport
 * No row overflows and no rectangle passes the viewport's edges, except inside a table, which scrolls.
 * Pass: a toolbar that wraps.
 * Fail: a toolbar that does not wrap, with a 1200 search field in a 1232 column.
 */
const inTable = (view: View, rect: Rect): boolean => {
  for (let at: Rect | undefined = rect; at; at = view.rect(at.parent))
    if (view.node(at.id)?.component === 'Table') return true;
  return false;
};

export const rule = defineRule<LayoutInput>(
  'LAYOUT-046',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views) {
      const overflowing = view.rects.filter(
        (rect) => rect.overflowX && !inTable(view, rect),
      );
      for (const rect of overflowing)
        issues.push(
          fail(
            `${rect.id} is a row ${Math.round(rect.width)}px wide, and its children need more width than that. The children of a row fit inside its width, except inside a table, which scrolls. Set the layout wrap of ${rect.id} to true, set its layout direction to column, or make its children narrower.`,
            rect.id,
          ),
        );
      const under = (rect: Rect) =>
        overflowing.some((row) => rect.parent === row.id);
      for (const rect of view.rects)
        if (
          (rect.x + rect.width > view.width + 0.5 || rect.x < -0.5) &&
          !inTable(view, rect) &&
          !under(rect)
        )
          issues.push(
            fail(
              `${rect.id} runs from ${Math.round(rect.x)}px to ${Math.round(rect.x + rect.width)}px, past the edges of the ${view.width}px viewport. Every node fits inside the viewport, except inside a table, which scrolls. Make ${rect.id} fit inside ${view.width}px: set its box width to fill, or give it a smaller widthPx.`,
              rect.id,
            ),
          );
    }
    return issues;
  },
);
