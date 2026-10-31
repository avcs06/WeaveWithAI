import { defineRule } from '../../../core/rules';
import type { WidgetInput } from './helpers';

/**
 * DESIGN-033 · mandatory
 * A widget shows exactly the states the IA gave it: each on at least one of
 * its nodes, and no node in another, so a screen's states are its widgets'.
 * Pass: the book detail with loading and notFound.
 * Fail: the same detail with an error line the IA never asked for.
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
              `${widget.id} must show ${missing.join(', ')}, but none of its nodes does; add a node for ${missing.length === 1 ? 'it' : 'each'}.`,
              widget.id,
            ),
          ]
        : []),
      ...build.nodes
        .filter((node) => node.states.some((s) => extra.includes(s)))
        .map((node) =>
          fail(
            `${node.id} shows in ${node.states.filter((s) => extra.includes(s)).join(', ')}, which ${widget.id} does not have; its states are ${[...given].join(', ') || 'default only'}.`,
            node.id,
          ),
        ),
    ];
  },
);
