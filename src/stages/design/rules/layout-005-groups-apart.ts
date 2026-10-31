import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { ACTIONS, isButton, type LayoutInput } from './layout-helpers';
import type { DesignNode } from '../schema';

/**
 * LAYOUT-005 · warning · H-05 Unrelated groups in a row stand apart
 * A row of three or more loose items of different kinds is grouped, and groups
 * in a row are at least twice their own gap apart.
 * Pass: a search field, then a group of two buttons 16 away whose buttons are 8 apart.
 * Fail: a search field, a count and a button as loose items 12 apart.
 */
const kind = (node: DesignNode | undefined) =>
  node?.role === 'input'
    ? 'input'
    : node && (ACTIONS.has(node.role) || isButton(node))
      ? 'action'
      : node?.role === 'navigation'
        ? 'navigation'
        : 'content';

export const rule = defineRule<LayoutInput>(
  'LAYOUT-005',
  'warning',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        // Rows of items; the sections of a page are LAYOUT-008's.
        if (rect.kind === 'frame' || view.layout(rect)?.direction !== 'row')
          continue;
        const kids = view.kids(rect.id);
        const leaves = kids.filter((kid) => !view.kids(kid.id).length);
        const kinds = new Set(leaves.map((leaf) => kind(view.node(leaf.id))));
        if (
          leaves.length === kids.length &&
          kids.length >= 3 &&
          kinds.size >= 2
        )
          issues.push(
            fail(
              `${rect.id} lines up ${[...kinds].join(', ')} items one gap apart; group related items and space the groups apart.`,
              rect.id,
            ),
          );
        const groups = kids.filter((kid) => view.kids(kid.id).length >= 2);
        const inner = Math.max(0, ...groups.map((group) => view.gap(group)));
        if (groups.length && kids.length >= 2 && view.gap(rect) < 2 * inner)
          issues.push(
            fail(
              `${rect.id} spaces its groups ${view.gap(rect)} apart, less than twice their own gap of ${inner}.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
