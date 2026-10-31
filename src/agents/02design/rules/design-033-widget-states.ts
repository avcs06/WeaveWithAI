import { defineRule } from '../../../core/rules';
import type { WidgetInput } from './helpers';

/**
 * DESIGN-033 · mandatory
 * A widget shows exactly the states the catalog gave it: each on at least one of
 * its nodes, and no node in another, so a screen's states are its widgets'.
 * Pass: the book detail with loading and notFound.
 * Fail: the same detail with an error line the catalog never gave it.
 */
export const widgetRule = defineRule<WidgetInput>(
  'DESIGN-033',
  'mandatory',
  ({ build, widget }, fail) => {
    const given = new Set<string>(widget.states);
    const shown = new Set<string>(
      build.nodes.flatMap((node) => node.states).filter((s) => s !== 'default'),
    );
    const missing = [...given].filter((state) => !shown.has(state));
    const extra = [...shown].filter((state) => !given.has(state));
    return [
      ...(missing.length
        ? [
            fail(
              `${widget.id} must show ${missing.join(', ')}, but none of its nodes shows in ${missing.length === 1 ? 'that state' : 'those states'}. A widget shows exactly the states the catalog gave it. Add a node for ${missing.length === 1 ? 'it' : 'each'}, with ${missing.length === 1 ? 'that state' : 'its state'} in its states.`,
              widget.id,
            ),
          ]
        : []),
      ...build.nodes
        .filter((node) => node.states.some((s) => extra.includes(s)))
        .map((node) =>
          fail(
            `${node.id} shows in ${node.states.filter((s) => extra.includes(s)).join(', ')}, which ${widget.id} does not have. A widget shows exactly the states the catalog gave it. The states of ${widget.id} are ${[...given].join(', ') || 'default only'}. Remove ${node.states.filter((s) => extra.includes(s)).join(', ')} from the states of ${node.id}.`,
            node.id,
          ),
        ),
    ];
  },
);
