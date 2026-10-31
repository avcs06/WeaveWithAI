import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { Rect } from '../layout';
import type { LayoutInput } from './layout-helpers';

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
                `${rect.id} spaces its children ${view.gap(rect)} apart, not less than the ${view.gap(around)} of ${around.id} around it; gaps shrink with depth, so make it smaller.`,
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
