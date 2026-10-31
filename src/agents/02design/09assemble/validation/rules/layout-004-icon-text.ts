import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';
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
              `${rect.id} is a row of the ${size}px icon ${found.mark.id} and the text ${found.text.id}, ${found.gap}px apart. An icon and its text are 4px apart when the icon is under 16px, 6px to 8px apart when it is under 20px, and 8px to 10px apart when it is 20px or larger. Set the layout gap of ${rect.id} to ${low === high ? `${low}px, which is spacing key ${low / 4}` : `${low}px to ${high}px, which is spacing key ${low / 4} or ${high / 4}`}.`,
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
              `${rect.id} spaces its icon and its text ${found.gap}px apart, and the row ${outer.id} around it spaces its children ${view.gap(outer)}px apart. The gap between an icon and its text is smaller than the gap of the row they sit in. Set the layout gap of ${outer.id} to more than ${found.gap}px, or the layout gap of ${rect.id} to less than ${view.gap(outer)}px.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
