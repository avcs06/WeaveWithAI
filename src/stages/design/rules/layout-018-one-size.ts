import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { isSized, type LayoutInput } from './layout-helpers';

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
              `${rect.id} mixes control sizes ${[...sizes].join(' and ')}; controls in one row share a size.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
