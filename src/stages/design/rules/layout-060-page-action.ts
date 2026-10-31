import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { LayoutInput } from './layout-helpers';

/**
 * LAYOUT-060 · warning · H-60 Page action in the header
 * On a page with a page header, the primary action is in that header, at its end.
 * Pass: a header ending with Add book.
 * Fail: Add book before Sign out in the header.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-060',
  'warning',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views) {
      if (view.screen.type !== 'page') continue;
      const header = view
        .kids(`${view.screen.id}.content`)
        .find((rect) => view.section(rect.id)?.kind === 'page-header');
      if (!header) continue;
      // Rectangles come in document order, so the last leaf is the end.
      const leaves = view.rects.filter(
        (rect) =>
          !view.kids(rect.id).length &&
          view.node(rect.id)?.section === header.id,
      );
      const primary = view.rects.filter(
        (rect) => view.node(rect.id)?.role === 'primary-action',
      );
      const inHeader = primary.filter(
        (rect) => view.node(rect.id)?.section === header.id,
      );
      const last = leaves.at(-1);
      if (!inHeader.length)
        issues.push(
          fail(
            `${view.screen.id} has a page header without the page's primary action; put it in ${header.id}, at the end.`,
            header.id,
          ),
        );
      else if (last && !inHeader.includes(last))
        issues.push(
          fail(
            `The primary action ${inHeader[0]?.id} is not at the end of the page header ${header.id}; put it last.`,
            inHeader[0]?.id,
          ),
        );
    }
    return issues;
  },
);
