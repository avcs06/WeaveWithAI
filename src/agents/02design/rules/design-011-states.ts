import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { type NodesInput, stepFields, steps } from './helpers';

/**
 * DESIGN-011 · mandatory
 * A screen's nodes show every state the plan lists for it, and a screen
 * serving a list effect shows empty and error. Loading, a field's error and a
 * submit's result are the design system's or a toast (user, 2026-10-31). The
 * plan's list alone shows nothing.
 * Pass: the shelf with its empty state and its load error.
 * Fail: the shelf without empty.
 */
export const rule = defineRule<NodesInput>(
  'DESIGN-011',
  'mandatory',
  ({ nodes, ia, ctx, screen }, fail) => {
    const own = ia.screens.find((s) => s.id === screen);
    if (!own) return [];
    const served = steps(ctx.flows).filter((step) =>
      own.flowSteps.includes(step.id),
    );
    // The plan's states say what the screen must show; only its nodes show them.
    const shown = new Set<string>(nodes.flatMap((node) => node.states));
    const needed = new Set<string>(
      own.states.filter((state) => state !== 'default'),
    );
    if (served.some((step) => step.effects.some((e) => e.change === 'list')))
      for (const state of ['empty', 'error']) needed.add(state);
    const missing = [...needed].filter((state) => !shown.has(state));
    return missing.length
      ? [
          fail(
            `${screen} must show ${missing.join(', ')}, but no node of ${screen} shows in ${missing.length === 1 ? 'that state' : 'those states'}. A screen shows every state its plan lists. A screen that lists records also shows empty and error. Add a node for ${missing.length === 1 ? 'it' : 'each'}, with ${missing.length === 1 ? 'that state' : 'its state'} in its states.`,
            screen,
          ),
        ]
      : [];
  },
);
