import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { stackOf } from '../../../gaps';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-001 · mandatory · H-01 Fixed gaps by what a column stacks
 * Code sets the gaps of a widget's and a new component's columns (gaps.ts): a
 * title to its description 4, a header to its content and content to content
 * 16, groups to groups 24. So a column holds a header and one node, content,
 * or groups, and a header above groups needs them in a column of their own.
 * It replaced "gaps shrink with depth" and took in H-09 (user, 2026-11-01).
 * Pass: a form's header above one column that holds its two groups of fields.
 * Fail: the header and the two groups in one column.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-001',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views) {
      const kidsOf = (id: string) => view.kids(id).flatMap((kid) => view.node(kid.id) ?? []);
      for (const rect of view.rects) {
        if (view.layout(rect)?.direction !== 'column') continue;
        const kind = view.section(rect.id)?.kind;
        const kids = kidsOf(rect.id);
        if (stackOf(kids, kidsOf, kind === 'list' || kind === 'cards') === 'mixed')
          issues.push(
            fail(
              `${rect.id} holds a header and then ${kids.length - 1} nodes, and some of them are groups: columns of two or more nodes. Code spaces a header 16px above its content and groups 24px apart, so one column cannot hold both. Put the ${kids.length - 1} nodes after the header in a column node of their own.`,
              rect.id,
            ),
          );
      }
    }
    return issues;
  },
);
