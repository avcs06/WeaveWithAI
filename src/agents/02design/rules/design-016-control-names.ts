import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { INTERACTIVE, type NodesInput } from './helpers';

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
            `${node.id} is an icon-only ${node.component} with no label. An icon-only control has a label, its accessible name. Give ${node.id} a label that says what it does.`,
            node.id,
          ),
        );
      else if (!node.text.trim() && !node.label.trim())
        issues.push(
          fail(
            `${node.id} has the role ${node.role}, with no text and no label. Every control has visible text or a label. Give ${node.id} the text it shows, or a label when it shows no text.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
