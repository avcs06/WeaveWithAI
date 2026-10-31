import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-065 · mandatory · H-65 Every async action has a place for its state
 * A node shown only when failing never pushes the content
 * after it: it comes last in its group, or the node it reports on shows the state in place.
 * Pass: an error line after the fields and the actions.
 * Fail: the same line above the first field.
 */
const ASYNC = new Set([
  'error',
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
    const list = new Intl.ListFormat('en-GB');
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
            `${node.id} shows only in the ${list.format(node.states)} ${node.states.length > 1 ? 'states' : 'state'}, and it comes before ${list.format(after.map((o) => o.id))}, which show in the default state. When ${node.id} appears, it pushes them down. A node that shows only in an error, denied or notFound state comes after the nodes beside it that show in the default state, or the node it reports on shows that state in place. Give ${node.id} a larger order than ${list.format(after.map((o) => o.id))}, or remove ${node.id} and let the node it reports on show the state in place.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
