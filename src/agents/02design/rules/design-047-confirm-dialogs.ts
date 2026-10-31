import { defineRule } from '../../../core/rules';
import { confirmingSteps, type PlanInput } from './helpers';

/**
 * DESIGN-047 · mandatory
 * A confirmation is a dialog (DS23, user 2026-10-31): the steps of a subflow
 * that asks the user to confirm, such as confirming a deletion, sit on a
 * dialog of the page that asks, never on the page itself.
 * Pass: confirming a deletion on the delete-book dialog.
 * Fail: the same step on the book page.
 */
export const rule = defineRule<PlanInput>(
  'DESIGN-047',
  'mandatory',
  ({ plan, ctx }, fail) => {
    const confirming = confirmingSteps(ctx.flows);
    return plan.screens
      .filter((screen) => screen.type === 'page')
      .flatMap((screen) => {
        const steps = screen.flowSteps.filter((id) => confirming.includes(id));
        return steps.length
          ? [fail(`${screen.id} is a page, and it serves ${steps.join(', ')} of a confirmation. A confirmation sits on a dialog of the page that asks, never on the page itself. Move ${steps.join(', ')} to the flowSteps of a dialog whose parent is ${screen.id}.`, screen.id)]
          : [];
      });
  },
);
