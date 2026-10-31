import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { isButton, type LayoutInput } from '../helpers';

/**
 * LAYOUT-011 · mandatory · H-11 Button groups
 * Buttons side by side are 8 apart; a danger button beside the primary needs more.
 * Pass: Cancel and Save 8 apart.
 * Fail: Cancel and Save 12 apart.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-011',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const parent = view.rect(rect.parent);
        if (!parent || view.layout(parent)?.direction !== 'row') continue;
        const siblings = view.kids(parent.id);
        const before = siblings[siblings.indexOf(rect) - 1];
        const a = before && view.node(before.id);
        const b = view.node(rect.id);
        if (!before || !isButton(a) || !isButton(b) || rect.gapBefore === null)
          continue;
        const roles = new Set([a?.role, b?.role]);
        const danger =
          roles.has('destructive-action') && roles.has('primary-action');
        if (danger && rect.gapBefore <= 8)
          issues.push(
            fail(
              `${a?.role === 'destructive-action' ? `The destructive button ${before.id} sits ${rect.gapBefore}px before the primary button ${rect.id}` : `The primary button ${before.id} sits ${rect.gapBefore}px before the destructive button ${rect.id}`}. A destructive button beside the primary button is more than 8px from it, or has a divider between them. Set the layout gap of ${parent.id} to more than 8px, or put a divider node between ${before.id} and ${rect.id}.`,
              rect.id,
            ),
          );
        if (!danger && rect.gapBefore !== 8)
          issues.push(
            fail(
              `${rect.id} is ${rect.gapBefore}px from the button ${before.id} before it. Buttons side by side are 8px apart. Set the layout gap of ${parent.id} to 8px (spacing key 2).`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
