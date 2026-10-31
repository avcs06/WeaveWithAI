import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-028 · mandatory · H-28 First viewport
 * On an entry page the H1 and the primary action end inside the first viewport;
 * a hero is never taller than one viewport.
 * Pass: a landing page whose title and Sign up button end above 800.
 * Fail: a hero 900 tall.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-028',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views) {
      const bottom = (id: string) =>
        (view.rect(id)?.y ?? 0) + (view.rect(id)?.height ?? 0);
      if (view.screen.entry && view.screen.type === 'page') {
        const title = view.rects.find(
          (rect) => view.node(rect.id)?.headingLevel === 1,
        );
        const primary = view.rects.find(
          (rect) => view.node(rect.id)?.role === 'primary-action',
        );
        for (const [what, rect] of [
          ['the level 1 heading', title],
          ['the primary action', primary],
        ] as const)
          if (rect && bottom(rect.id) > view.height)
            issues.push(
              fail(
                `${rect.id} is ${what} of the entry page ${view.screen.id}, and it ends ${Math.round(bottom(rect.id))}px from the top, below the first viewport of ${view.height}px. On an entry page, the level 1 heading and the primary action end inside the first viewport. Move ${rect.id} up by at least ${Math.ceil(bottom(rect.id) - view.height)}px, by making what sits above it shorter.`,
                rect.id,
              ),
            );
      }
      for (const rect of view.rects)
        if (view.section(rect.id)?.kind === 'hero' && rect.height > view.height)
          issues.push(
            fail(
              `${rect.id} is a hero ${Math.round(rect.height)}px tall, and the viewport is ${view.height}px tall. A hero is at most one viewport tall. Make ${rect.id} at least ${Math.ceil(rect.height - view.height)}px shorter. Lower its box minHeightPx or its layout padding, or move nodes out of it.`,
              rect.id,
            ),
          );
    }
    return issues;
  },
);
