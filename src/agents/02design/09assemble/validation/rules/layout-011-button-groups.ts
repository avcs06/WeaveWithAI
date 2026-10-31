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
              `${rect.id} sits ${rect.gapBefore} from ${before.id}: a danger button never sits right beside the primary; add space or a divider.`,
              rect.id,
            ),
          );
        if (!danger && rect.gapBefore !== 8)
          issues.push(
            fail(
              `${rect.id} is ${rect.gapBefore} from the button before it; buttons in a group are 8 apart.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
