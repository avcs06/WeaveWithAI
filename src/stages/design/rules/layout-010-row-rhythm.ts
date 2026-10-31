import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { Rect } from '../layout';
import type { LayoutInput, View } from './layout-helpers';

/**
 * LAYOUT-010 · mandatory · H-10 Lists and tables keep one row rhythm
 * The repeated items of a list or cards section (siblings that share a
 * component, or a `what` when they are plain boxes) share a height on each
 * line and one gap: 8 to 16 as cards, 0 to 12 as rows. A heading or a
 * pagination beside the list is not one of its items.
 * Pass: three cards of one height, 8 apart, under the section's heading.
 * Fail: two cards of different heights.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-010',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const kind = view.section(rect.id)?.kind;
        if (kind !== 'list' && kind !== 'cards') continue;
        // The section itself or one of its blocks holds the repeated items.
        const found = [rect, ...view.kids(rect.id)]
          .map((holder) => ({ holder, items: repeated(view, holder.id) }))
          .find(({ items }) => items.length >= 2);
        if (!found) continue;
        const { holder, items } = found;
        const cards = items.every(
          (item) => view.node(item.id)?.component === 'Card',
        );
        const lines = new Map<number, number[]>();
        for (const item of items)
          lines.set(Math.round(item.y), [
            ...(lines.get(Math.round(item.y)) ?? []),
            item.height,
          ]);
        const column =
          view.layout(holder)?.direction !== 'row' &&
          view.layout(holder)?.direction !== 'grid';
        const heights = column
          ? [items.map((item) => item.height)]
          : [...lines.values()];
        if (heights.some((line) => new Set(line.map(Math.round)).size > 1))
          issues.push(
            fail(
              `The items of ${holder.id} differ in height; rows of a list share one height.`,
              holder.id,
            ),
          );
        const [low, high] = cards ? [8, 16] : [0, 12];
        const gaps = [
          ...new Set(items.slice(1).map((item) => item.gapBefore ?? 0)),
        ];
        const gap = gaps[0] ?? 0;
        if (gaps.length > 1 || gap < low || gap > high)
          issues.push(
            fail(
              `The items of ${holder.id} are ${gaps.join(', ')} apart; ${cards ? 'cards' : 'rows'} keep one gap of ${low} to ${high}.`,
              holder.id,
            ),
          );
      }
    return issues;
  },
);

/** The largest set of a box's children that share a component, or a `what` when they are plain boxes. */
function repeated(view: View, id: string): Rect[] {
  const groups = new Map<string, Rect[]>();
  for (const kid of view.kids(id)) {
    const node = view.node(kid.id);
    if (!node) continue;
    const key = node.component === 'none' ? `what:${node.what}` : node.component;
    groups.set(key, [...(groups.get(key) ?? []), kid]);
  }
  return [...groups.values()].sort((a, b) => b.length - a.length)[0] ?? [];
}
