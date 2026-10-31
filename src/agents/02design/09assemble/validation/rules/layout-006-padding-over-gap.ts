import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-006 · mandatory · H-06 Padding is never smaller than the gap inside it
 * A padded box (a page, a dialog, a card, a padded section) spaces its children no
 * further apart than its smallest padding.
 * Pass: a side panel with padding 24 whose items are 20 apart.
 * Fail: the same panel with its items 32 apart.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-006',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        // A page or dialog spaces its sections through its content box.
        const inner = rect.depth === 0 ? view.rect(`${rect.id}.content`) : rect;
        if (!inner || view.kids(inner.id).length < 2) continue;
        const padding = Math.min(...rect.padding);
        const gap = view.gap(inner);
        if (padding > 0 && gap > padding)
          issues.push(
            fail(
              `${rect.id} has padding ${padding} but spaces its children ${gap} apart; the padding is never smaller than the gap inside it.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
