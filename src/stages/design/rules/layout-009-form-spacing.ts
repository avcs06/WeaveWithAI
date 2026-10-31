import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { Rect } from '../layout';
import type { LayoutInput, View } from './layout-helpers';

/**
 * LAYOUT-009 · mandatory · H-09 Form spacing
 * Field to field 16; group of fields to group of fields 24.
 * Pass: title, author and shelf fields 16 apart.
 * Fail: the same fields 12 apart.
 */
const holdsInput = (view: View, rect: Rect): boolean =>
  view
    .kids(rect.id)
    .some(
      (kid) => view.node(kid.id)?.role === 'input' || holdsInput(view, kid),
    );

export const rule = defineRule<LayoutInput>(
  'LAYOUT-009',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const siblings = view.kids(rect.parent);
        const before = siblings[siblings.indexOf(rect) - 1];
        if (!before || rect.gapBefore === null) continue;
        const input = (r: Rect) => view.node(r.id)?.role === 'input';
        const group = (r: Rect) =>
          view.kids(r.id).length > 0 && holdsInput(view, r);
        if (input(rect) && input(before) && rect.gapBefore !== 16)
          issues.push(
            fail(
              `${rect.id} is ${rect.gapBefore} from the field before it; fields are 16 apart.`,
              rect.id,
            ),
          );
        if (group(rect) && group(before) && rect.gapBefore !== 24)
          issues.push(
            fail(
              `${rect.id} is ${rect.gapBefore} from the group of fields before it; groups are 24 apart.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
