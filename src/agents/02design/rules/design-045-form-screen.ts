import { defineRule } from '../../../core/rules';
import { type PlanInput, stepFields, steps } from './helpers';

/**
 * DESIGN-045 · mandatory
 * A step that saves fields is on one screen, the one with its form.
 * On a second screen, such as the page that opens the
 * dialog or the page the step lands on, a widget there would have to take the
 * step's fields.
 * Pass: saving a client on the client dialog alone; choosing to add one on the clients page.
 * Fail: saving a client on both the dialog and the clients page.
 */
export const rule = defineRule<PlanInput>(
  'DESIGN-045',
  'mandatory',
  ({ plan, ctx }, fail) =>
    steps(ctx.flows)
      .filter((step) => step.kind === 'user' && stepFields(ctx.flows, step).length > 0)
      .flatMap((step) => {
        const on = plan.screens.filter((s) => s.flowSteps.includes(step.id)).map((s) => s.id);
        return on.length > 1
          ? [fail(`${step.id} saves fields, and it is on ${on.length} screens: ${on.join(', ')}. A step that saves fields is on one screen only, the one with its form. Keep ${step.id} in the flowSteps of the screen with its form only. A screen that opens that form serves the step that opens it, not ${step.id}.`, step.id)]
          : [];
      }),
);
