import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { LayoutInput } from './layout-helpers';
import { pair } from './layout-003-related-pairs';

/**
 * LAYOUT-004 · mandatory · H-04 Icon to text in one line
 * The gap follows the icon size: 4 for icons under 16, 6 to 8 under 20, 8 to 10 from 20;
 * and it is smaller than the gap of a row the pair sits in.
 * Pass: a 20 icon 8 from its title.
 * Fail: a 16 icon 4 from its text.
 */
const range = (size: number): [number, number] =>
  size < 16 ? [4, 4] : size < 20 ? [6, 8] : [8, 10];

export const rule = defineRule<LayoutInput>(
  'LAYOUT-004',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const found = pair(view, rect);
        if (!found || view.node(found.mark.id)?.role !== 'media') continue;
        const size = Math.min(found.mark.width, found.mark.height);
        const [low, high] = range(size);
        if (found.gap < low || found.gap > high)
          issues.push(
            fail(
              `${rect.id} puts its ${size} icon ${found.gap} from the text; at that size use ${low === high ? low : `${low} to ${high}`}.`,
              rect.id,
            ),
          );
        const outer = view.rect(rect.parent);
        if (
          outer &&
          view.layout(outer)?.direction === 'row' &&
          found.gap >= view.gap(outer)
        )
          issues.push(
            fail(
              `${rect.id} spaces its icon and text ${found.gap} apart, not less than the ${view.gap(outer)} between the items of ${outer.id}.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
