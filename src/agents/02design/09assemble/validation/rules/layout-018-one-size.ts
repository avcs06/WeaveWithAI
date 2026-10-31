import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { isSized, type LayoutInput } from '../helpers';

/**
 * LAYOUT-018 · mandatory · H-18 One size per row
 * Buttons, fields and chips in one row share a size.
 * Pass: Cancel and Save, both md.
 * Fail: Cancel sm beside Save md.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-018',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        if (view.layout(rect)?.direction !== 'row') continue;
        const sized = view
          .kids(rect.id)
          .map((kid) => view.node(kid.id))
          .filter(isSized);
        const sizes = new Set(
          sized.map((node) => node?.size.replace(/^icon-/, '')),
        );
        if (sizes.size > 1)
          issues.push(
            fail(
              `${rect.id} is a row of controls of different sizes. ${new Intl.ListFormat('en-GB').format(sized.map((node) => `${node?.id} has size ${node?.size}`))}. Buttons, fields and chips in one row share one size. Give every control in ${rect.id} the same size.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
