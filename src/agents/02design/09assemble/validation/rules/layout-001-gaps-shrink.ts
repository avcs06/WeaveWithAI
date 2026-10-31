import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { Rect } from '../../skeleton/skeleton';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-001 · mandatory · H-01 Gaps shrink with depth
 * A box with two or more children spaces them closer than the nearest such box around it.
 * Pass: sections 24 apart, a form's fields 16, an icon row 8.
 * Fail: a toolbar whose items are 32 apart on a page whose sections are 24 apart.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-001',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views) {
      const walk = (rect: Rect, around: Rect | undefined): void => {
        const kids = view.kids(rect.id);
        let next = around;
        if (kids.length >= 2 && view.layout(rect)) {
          if (around && view.gap(rect) >= view.gap(around))
            issues.push(
              fail(
                `${rect.id} spaces its children ${view.gap(rect)}px apart, and ${around.id === `${view.screen.id}.content` ? `the ${view.screen.type} ${view.screen.id}` : around.id} around it spaces its children ${view.gap(around)}px apart. A box spaces its children closer than the box around it does. Set the layout gap of ${rect.id} to less than ${view.gap(around)}px.`,
                rect.id,
              ),
            );
          next = rect;
        }
        for (const kid of kids) walk(kid, next);
      };
      const content = view.rect(`${view.screen.id}.content`);
      if (content) walk(content, undefined);
    }
    return issues;
  },
);
