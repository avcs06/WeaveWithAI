import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { Rect } from '../../skeleton/skeleton';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-070 · mandatory · H-70 Nothing hides under an overlay header
 * A region drawn over the page covers the top of the content; every node of
 * the content starts below it, so the first section's padding clears it.
 * Pass: the landing hero's title 8 below the 64 tall marketing top bar.
 * Fail: the hero padding dropped, the title under the bar.
 */
const BOXES = new Set<Rect['kind']>(['frame', 'section', 'container']);

export const rule = defineRule<LayoutInput>(
  'LAYOUT-070',
  'mandatory',
  ({ screens, views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views) {
      const shell = screens.shells.find((s) => s.id === view.screen.shell);
      const under = (id: string): Rect[] =>
        view.kids(id).flatMap((rect) => [rect, ...under(rect.id)]);
      const content = under(`${view.screen.id}.content`).filter(
        (rect) => !BOXES.has(rect.kind),
      );
      for (const region of shell?.regions.filter((r) => r.overlay) ?? []) {
        const bar = view.rect(region.id);
        if (!bar) continue;
        for (const rect of content)
          if (
            rect.y < bar.y + bar.height &&
            rect.x < bar.x + bar.width &&
            rect.x + rect.width > bar.x
          )
            issues.push(
              fail(
                `${rect.id} starts at ${Math.round(rect.y)}, under ${region.id}, which ends at ${Math.round(bar.y + bar.height)}; pad the first section so the content clears it.`,
                rect.id,
              ),
            );
      }
    }
    return issues;
  },
);
