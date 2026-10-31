import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { stepFields, steps, type WidgetIaInput } from './helpers';

/**
 * DESIGN-031 · mandatory
 * The IA gives every state and field to a widget. Each state a screen lists
 * is one of its widgets' states; a screen serving a list shows loading,
 * empty and error, and one serving a submission invalid, submitting and
 * error; every field of a user step is taken by a widget that serves the step.
 * Pass: the shelf's table with loading and error, its empty state with empty.
 * Fail: the same shelf without the empty state widget.
 */
export const iaRule = defineRule<WidgetIaInput>(
  'DESIGN-031',
  'mandatory',
  ({ ia, ctx }, fail) => {
    const issues: Issue[] = [];
    const widgets = new Map(ia.widgets.map((w) => [w.id, w]));
    const all = steps(ctx.flows);
    for (const screen of ia.screens) {
      const own = ia.placements
        .filter((p) => p.screen === screen.id)
        .flatMap((p) => widgets.get(p.widget) ?? []);
      const served = new Set(own.flatMap((w) => w.flowSteps));
      const shown = new Set<string>(own.flatMap((w) => w.states));
      const needed = new Set<string>(
        screen.states.filter((s) => s !== 'default'),
      );
      const serves = all.filter((step) => served.has(step.id));
      if (serves.some((step) => step.effects.some((e) => e.change === 'list')))
        for (const state of ['loading', 'empty', 'error']) needed.add(state);
      if (
        serves.some(
          (step) => step.kind === 'user' && stepFields(ctx.flows, step).length,
        )
      )
        for (const state of ['invalid', 'submitting', 'error'])
          needed.add(state);
      const missing = [...needed].filter((state) => !shown.has(state));
      if (missing.length)
        issues.push(
          fail(
            `${screen.id} must show ${missing.join(', ')}, but none of its widgets has ${missing.length === 1 ? 'it' : 'them'} among its states.`,
            screen.id,
          ),
        );
    }
    for (const step of all.filter((s) => s.kind === 'user'))
      for (const field of stepFields(ctx.flows, step))
        if (
          !ia.widgets.some(
            (w) => w.flowSteps.includes(step.id) && w.fields.includes(field),
          )
        )
          issues.push(
            fail(
              `${step.id} asks for ${field}, but no widget serving it takes the field; list it on the widget with the step's form.`,
              step.id,
            ),
          );
    return issues;
  },
);
