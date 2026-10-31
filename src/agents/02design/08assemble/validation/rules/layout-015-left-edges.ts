import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { Rect } from '../../skeleton/skeleton';
import {
  isColumn,
  type LayoutInput,
  lineStarts,
  type View,
} from '../helpers';

/**
 * LAYOUT-015 · mandatory · H-15 One left edge per column
 * The lines of a column start on at most two x positions.
 * Pass: a column of rows whose text all starts at one edge.
 * Fail: a column with rows indented by 16 and by 24.
 */
const within = (view: View, inner: Rect, outer: Rect): boolean => {
  for (let at = view.rect(inner.parent); at; at = view.rect(at.parent))
    if (at.id === outer.id) return true;
  return false;
};

export const rule = defineRule<LayoutInput>(
  'LAYOUT-015',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views) {
      const failing = view.rects.filter((rect) => {
        const layout = view.layout(rect);
        if (!layout || !isColumn(layout) || view.kids(rect.id).length < 2)
          return false;
        return (
          new Set(lineStarts(view, rect).map((leaf) => Math.round(leaf.x)))
            .size > 2
        );
      });
      // The smallest failing column says where to fix it.
      for (const rect of failing) {
        if (
          failing.some((other) => other !== rect && within(view, other, rect))
        )
          continue;
        const edges = [
          ...new Set(
            lineStarts(view, rect).map((leaf) => Math.round(leaf.x - rect.x)),
          ),
        ].sort((a, b) => a - b);
        const list = new Intl.ListFormat('en-GB');
        const where = edges.map((edge) => {
          const ids = lineStarts(view, rect)
            .filter((leaf) => Math.round(leaf.x - rect.x) === edge)
            .map((leaf) => leaf.id);
          return `${list.format(ids)} ${ids.length > 1 ? 'start' : 'starts'} ${edge}px in`;
        });
        issues.push(
          fail(
            `The lines in ${rect.id} start at ${edges.length} left edges. ${list.format(where)}. The lines of a column start on at most two left edges. Change the layout padding of the boxes that hold these nodes, so every line in ${rect.id} starts on one of at most two edges.`,
            rect.id,
          ),
        );
      }
    }
    return issues;
  },
);
