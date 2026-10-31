import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { Rect } from '../../skeleton/skeleton';
import type { LayoutInput, View } from '../helpers';

/**
 * LAYOUT-003 · mandatory · H-03 Related pairs use the smallest gaps
 * An icon or avatar beside its text, in a row of two, is 4 to 10 from it.
 * Pass: a 16 icon 8 from the author's name.
 * Fail: the same icon 16 from it.
 */
export function pair(
  view: View,
  row: Rect,
): { mark: Rect; text: Rect; gap: number } | undefined {
  const kids = view.kids(row.id);
  if (view.layout(row)?.direction !== 'row' || kids.length !== 2)
    return undefined;
  const [a, b] = kids as [Rect, Rect];
  const mark = (rect: Rect) => {
    const node = view.node(rect.id);
    return Boolean(
      node &&
      !node.newComponent &&
      ((node.role === 'media' && node.component === 'none') ||
        node.component === 'Avatar'),
    );
  };
  const text = (rect: Rect) => rect.kind === 'text';
  if (mark(a) && text(b)) return { mark: a, text: b, gap: b.gapBefore ?? 0 };
  if (text(a) && mark(b)) return { mark: b, text: a, gap: b.gapBefore ?? 0 };
  return undefined;
}

export const rule = defineRule<LayoutInput>(
  'LAYOUT-003',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const found = pair(view, rect);
        if (found && (found.gap < 4 || found.gap > 10))
          issues.push(
            fail(
              `${rect.id} puts ${found.text.id} ${found.gap} from ${found.mark.id}; an icon or avatar and its text are a pair, 4 to 10 apart.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
