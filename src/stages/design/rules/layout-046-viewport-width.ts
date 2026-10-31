import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { Rect } from '../layout';
import type { LayoutInput, View } from './layout-helpers';

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
            `${rect.id} does not fit its ${Math.round(rect.width)}; let it wrap, stack it, or shorten its items.`,
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
              `${rect.id} runs past the ${view.width} viewport; nothing is wider than the viewport.`,
              rect.id,
            ),
          );
    }
    return issues;
  },
);
