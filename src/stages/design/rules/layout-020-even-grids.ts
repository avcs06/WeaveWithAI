import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { LayoutInput } from './layout-helpers';

/**
 * LAYOUT-020 · warning · H-20 Grids stay even
 * A grid leaves no single orphan in its last row.
 * Pass: three features in three columns.
 * Fail: four features in three columns.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-020',
  'warning',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const layout = view.layout(rect);
        if (layout?.direction !== 'grid' || layout.columns < 2) continue;
        const rows = new Map<number, number>();
        for (const kid of view.kids(rect.id))
          rows.set(Math.round(kid.y), (rows.get(Math.round(kid.y)) ?? 0) + 1);
        const counts = [...rows.values()];
        if (counts.length > 1 && counts.at(-1) === 1)
          issues.push(
            fail(
              `${rect.id} leaves one item alone in its last row; change the column count or the items so the rows stay even.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
