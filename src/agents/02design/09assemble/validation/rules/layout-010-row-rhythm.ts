import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { Rect } from '../../skeleton/skeleton';
import type { LayoutInput, View } from '../helpers';

/**
 * LAYOUT-010 · mandatory · H-10 Lists and tables keep one row rhythm
 * The repeated items of a list or cards section (siblings that share a
 * component, or a `what` when they are plain boxes) keep one gap: 8 to 16 as
 * cards, 0 to 12 as rows. Items side by side share a height by structure: the
 * row or grid holding them stretches them, since the height of text that
 * wraps is not known before a render (DS28). A heading or a pagination beside
 * the list is not one of its items.
 * Pass: three cards in a stretched grid, 8 apart, under the section's heading.
 * Fail: cards in a grid aligned to the start, so each is as tall as its text.
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
        const layout = view.layout(holder);
        const sideBySide =
          layout?.direction === 'row' || layout?.direction === 'grid';
        if (sideBySide && layout?.align !== 'stretch')
          issues.push(
            fail(
              `${holder.id} holds its repeated items side by side with layout align ${layout?.align}, so each item is as tall as its own content. Items side by side share one height on each line. Set the layout align of ${holder.id} to stretch.`,
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
              `${gaps.length > 1 ? `The gaps between the repeated items of ${holder.id} are ${new Intl.ListFormat('en-GB').format(gaps.map((g) => `${g}px`))}` : `The repeated items of ${holder.id} are ${gap}px apart`}. Repeated ${cards ? 'cards' : 'rows'} keep one gap of ${low}px to ${high}px. Set the layout gap of ${holder.id} to ${low}px to ${high}px, which is spacing key ${low / 4} to ${high / 4}.`,
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
