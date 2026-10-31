import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { isColumn, isHeading, type LayoutInput } from '../helpers';

/**
 * LAYOUT-013 · warning · H-13 Paragraph spacing
 * Paragraphs are 8 to 12 apart, and closer than a heading is to its first paragraph.
 * Pass: two paragraphs 8 apart under a heading 12 above them.
 * Fail: two paragraphs 4 apart.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-013',
  'warning',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const parent = view.rect(rect.parent);
        if (
          !parent ||
          !isColumn(view.layout(parent)) ||
          view.node(rect.id)?.role !== 'text'
        )
          continue;
        const siblings = view.kids(parent.id);
        const index = siblings.indexOf(rect);
        const before = siblings[index - 1];
        if (
          !before ||
          view.node(before.id)?.role !== 'text' ||
          rect.gapBefore === null
        )
          continue;
        if (rect.gapBefore < 8 || rect.gapBefore > 12)
          issues.push(
            fail(
              `${rect.id} is ${rect.gapBefore} below the paragraph before it; paragraphs are 8 to 12 apart.`,
              rect.id,
            ),
          );
        let first = index - 1;
        while (
          first > 0 &&
          view.node(siblings[first - 1]?.id ?? '')?.role === 'text'
        )
          first -= 1;
        const heading = siblings[first - 1];
        const lead = siblings[first]?.gapBefore;
        if (
          heading &&
          isHeading(view.node(heading.id)) &&
          lead !== null &&
          lead !== undefined &&
          rect.gapBefore >= lead
        )
          issues.push(
            fail(
              `${rect.id} is ${rect.gapBefore} below the paragraph before it, not less than the ${lead} between ${heading.id} and its first paragraph.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
