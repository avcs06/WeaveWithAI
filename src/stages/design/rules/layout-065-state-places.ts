import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { LayoutInput } from './layout-helpers';

/**
 * LAYOUT-065 · mandatory · H-65 Every async action has a place for its state
 * A node shown only while loading, submitting or failing never pushes the content
 * after it: it comes last in its group, or the node it reports on shows the state in place.
 * Pass: an error line after the fields and the actions.
 * Fail: the same line above the first field.
 */
const ASYNC = new Set([
  'loading',
  'submitting',
  'error',
  'invalid',
  'denied',
  'notFound',
]);

export const rule = defineRule<LayoutInput>(
  'LAYOUT-065',
  'mandatory',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    const shown = (states: string[]) =>
      !states.length || states.includes('default');
    for (const node of screens.nodes) {
      if (shown(node.states) || !node.states.some((state) => ASYNC.has(state)))
        continue;
      const after = screens.nodes.filter(
        (other) =>
          other.section === node.section &&
          other.parent === node.parent &&
          other.order > node.order &&
          shown(other.states),
      );
      if (after.length)
        issues.push(
          fail(
            `${node.id} appears only when ${node.states.join(' or ')} and pushes ${after.map((o) => o.id).join(', ')} when it does; put it after them or reserve its place.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
