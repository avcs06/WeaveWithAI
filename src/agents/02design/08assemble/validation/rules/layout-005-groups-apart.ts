import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { ACTIONS, isButton, type LayoutInput } from '../helpers';
import type { DesignNode } from '../../../schema';

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

const KIND_NAMES = {
  input: 'an input',
  action: 'an action',
  navigation: 'navigation',
  content: 'content',
};

export const rule = defineRule<LayoutInput>(
  'LAYOUT-005',
  'warning',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        // Rows of items; the theme spaces a page's sections (THEME-007).
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
              `${rect.id} is a row of ${kids.length} nodes of ${kinds.size} kinds, all ${view.gap(rect)}px apart, and none of them is a group. ${new Intl.ListFormat('en-GB').format(leaves.map((leaf) => `${leaf.id} is ${KIND_NAMES[kind(view.node(leaf.id))]}`))}. A row of three or more nodes of different kinds puts the nodes that belong together in groups. Put the nodes of ${rect.id} that belong together in a row node of their own, one row node for each group. Then set the layout gap of ${rect.id} to at least twice the layout gap inside each group.`,
              rect.id,
            ),
          );
        const groups = kids.filter((kid) => view.kids(kid.id).length >= 2);
        const inner = Math.max(0, ...groups.map((group) => view.gap(group)));
        if (groups.length && kids.length >= 2 && view.gap(rect) < 2 * inner)
          issues.push(
            fail(
              `${rect.id} spaces its groups ${view.gap(rect)}px apart, and the largest gap inside a group is ${inner}px. The gap between the groups of a row is at least twice the gap inside each group. Set the layout gap of ${rect.id} to at least ${2 * inner}px.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
