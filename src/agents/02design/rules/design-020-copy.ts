import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { ACTIONS, type NodesInput } from './helpers';

/**
 * DESIGN-020 · warning
 * No placeholder copy; action text starts with a verb. The verb check flags
 * the words an action label most often starts with that are not verbs.
 * Pass: "Save book".
 * Fail: "Lorem ipsum", or "Back to shelf".
 */
const PLACEHOLDER = /\b(lorem|ipsum|todo|tbd|placeholder|xxx)\b/i;
const NOT_VERBS = new Set([
  'a',
  'an',
  'the',
  'my',
  'your',
  'our',
  'new',
  'all',
  'more',
  'back',
  'next',
  'ok',
  'okay',
  'yes',
  'no',
]);

export const rule = defineRule<NodesInput>(
  'DESIGN-020',
  'warning',
  ({ nodes }, fail) => {
    const issues: Issue[] = [];
    for (const node of nodes) {
      const copy = `${node.text} ${node.label}`;
      if (PLACEHOLDER.test(copy))
        issues.push(
          fail(
            `${node.id} has placeholder copy ("${copy.trim()}"); write the real words.`,
            node.id,
          ),
        );
      const first = node.text.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
      if (ACTIONS.has(node.role) && first && NOT_VERBS.has(first))
        issues.push(
          fail(
            `${node.id} says "${node.text}"; start an action's text with a verb.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
