import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { type NodesInput, stepFields, steps } from './design-helpers';

/**
 * DESIGN-011 · mandatory
 * A screen's nodes show every state the IA lists for it; a screen serving a list
 * effect shows loading, empty and error, and one serving a submission invalid,
 * submitting, error and success (or its submit navigates on). The IA's list
 * alone shows nothing.
 * Pass: the shelf with loading, empty and error.
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
    // The IA's states say what the screen must show; only its nodes show them.
    const shown = new Set<string>(nodes.flatMap((node) => node.states));
    const needed = new Set<string>(
      own.states.filter((state) => state !== 'default'),
    );
    if (served.some((step) => step.effects.some((e) => e.change === 'list')))
      for (const state of ['loading', 'empty', 'error']) needed.add(state);
    if (
      served.some(
        (step) =>
          step.kind === 'user' && stepFields(ctx.flows, step).length > 0,
      )
    )
      for (const state of ['invalid', 'submitting', 'error', 'success'])
        needed.add(state);
    if (nodes.some((node) => node.role === 'primary-action' && node.navigatesTo))
      needed.delete('success');
    const missing = [...needed].filter((state) => !shown.has(state));
    return missing.length
      ? [
          fail(
            `${screen} must show ${missing.join(', ')}, but none of its nodes does; add a node for ${missing.length === 1 ? 'it' : 'each'}.`,
            screen,
          ),
        ]
      : [];
  },
);
