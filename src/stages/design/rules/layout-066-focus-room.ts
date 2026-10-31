import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { INTERACTIVE, type LayoutInput } from './layout-helpers';

/**
 * LAYOUT-066 · mandatory · H-66 Room for the focus ring
 * Every focusable rectangle keeps the ring's clearance (at least 6) from its
 * siblings. The edges of a card or a dialog are the design system's padding,
 * which already clears the ring.
 * Pass: Cancel and Save 8 apart.
 * Fail: Cancel and Save 4 apart.
 */

export const rule = defineRule<LayoutInput>(
  'LAYOUT-066',
  'mandatory',
  ({ views, ringPx }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        if (!INTERACTIVE.has(view.node(rect.id)?.role ?? '')) continue;
        const siblings = view.kids(rect.parent);
        const next = siblings[siblings.indexOf(rect) + 1];
        const near = [rect.gapBefore, next?.gapBefore].filter(
          (gap): gap is number => gap !== null && gap !== undefined,
        );
        if (near.some((gap) => gap < ringPx))
          issues.push(
            fail(
              `${rect.id} is ${Math.min(...near)} from a sibling; leave ${ringPx} for its focus ring.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
