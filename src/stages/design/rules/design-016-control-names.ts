import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { INTERACTIVE, type NodesInput } from './design-helpers';

/**
 * DESIGN-016 · mandatory
 * A control has visible text or a label; an icon-only control has a label.
 * Pass: the search input labelled "Search by title or author".
 * Fail: the same input with no label.
 */
export const rule = defineRule<NodesInput>(
  'DESIGN-016',
  'mandatory',
  ({ nodes }, fail) => {
    const issues: Issue[] = [];
    for (const node of nodes) {
      if (!INTERACTIVE.has(node.role) && !node.component.endsWith('IconButton'))
        continue;
      if (node.component.endsWith('IconButton') && !node.label.trim())
        issues.push(
          fail(
            `${node.id} is an icon-only ${node.component}; give it a label.`,
            node.id,
          ),
        );
      else if (!node.text.trim() && !node.label.trim())
        issues.push(
          fail(
            `${node.id} is a ${node.role} with no text and no label; give it a name.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
