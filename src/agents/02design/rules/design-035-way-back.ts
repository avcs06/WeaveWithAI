import { defineRule } from '../../../core/rules';
import type { NodesInput } from './helpers';

/**
 * DESIGN-035 · mandatory
 * What shows notFound offers a way out there: a navigation node, shown in
 * notFound or always, going to another screen.
 * Pass: the book page's "This book is no longer on your shelf." with Return to shelf.
 * Fail: the same message with Return to shelf removed.
 */
export const rule = defineRule<NodesInput>(
  'DESIGN-035',
  'mandatory',
  ({ nodes, screen }, fail) => {
    const lost = nodes.find((node) => node.states.includes('notFound'));
    const out = nodes.some(
      (node) =>
        node.role === 'navigation' &&
        node.navigatesTo &&
        node.navigatesTo !== screen &&
        node.states.some((s) => s === 'notFound' || s === 'default'),
    );
    return lost && !out
      ? [
          fail(
            `${lost.id} shows notFound with no way out; add a navigation node shown then, going to the page the user came from.`,
            lost.id,
          ),
        ]
      : [];
  },
);
