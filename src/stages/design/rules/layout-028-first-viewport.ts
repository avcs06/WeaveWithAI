import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { LayoutInput } from './layout-helpers';

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
          ['the H1', title],
          ['the primary action', primary],
        ] as const)
          if (rect && bottom(rect.id) > view.height)
            issues.push(
              fail(
                `${rect.id}, ${what}, ends at ${Math.round(bottom(rect.id))}, below the first ${view.height}; move it up.`,
                rect.id,
              ),
            );
      }
      for (const rect of view.rects)
        if (view.section(rect.id)?.kind === 'hero' && rect.height > view.height)
          issues.push(
            fail(
              `${rect.id} is ${Math.round(rect.height)} tall; a hero fits in one ${view.height} viewport.`,
              rect.id,
            ),
          );
    }
    return issues;
  },
);
