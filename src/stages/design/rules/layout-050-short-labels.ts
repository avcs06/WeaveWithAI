import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { isButton, type LayoutInput, words } from './layout-helpers';

/**
 * LAYOUT-050 · warning · H-50 Short labels
 * Button labels at most three words, headings at most eight.
 * Pass: "Save book".
 * Fail: "Save this book to my shelf".
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-050',
  'warning',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    for (const node of screens.nodes) {
      const count = words(node.text);
      if (isButton(node) && count > 3)
        issues.push(
          fail(
            `${node.id} says "${node.text}", ${count} words; a button label is at most three.`,
            node.id,
          ),
        );
      if (node.role === 'heading' && count > 8)
        issues.push(
          fail(
            `${node.id} says "${node.text}", ${count} words; a heading is at most eight.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
