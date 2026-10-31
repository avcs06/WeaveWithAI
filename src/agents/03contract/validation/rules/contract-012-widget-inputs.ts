import type { Issue } from '../../../../core/issues';
import { defineRule } from '../../../../core/rules';
import { stepFields } from '../../../01flows/schema';
import { allSteps, type ContractInput } from '../helpers';

/**
 * CONTRACT-012 · mandatory
 * Every field a widget asks for at a step is an input of an operation that
 * serves the same flow, where the value is saved or searched with. Sign-up
 * and sign-in fields go to the built-in auth operations.
 * Pass: W07 asks for FD03 at F03.S02, and createBook takes it.
 * Fail: createBook takes no FD03.
 */
const AUTH = new Set(['signUp', 'signIn']);
const flowOf = (step: string) => step.split('.')[0] ?? '';

export const rule = defineRule<ContractInput>(
  'CONTRACT-012',
  'mandatory',
  ({ contract, flows, widgets }, fail) => {
    const issues: Issue[] = [];
    const steps = new Map(allSteps(flows).map((s) => [s.id, s]));
    for (const widget of widgets) {
      const missing = new Map<string, string>();
      for (const id of widget.flowSteps) {
        const step = steps.get(id);
        if (!step || step.kind !== 'user' || AUTH.has(step.authKind)) continue;
        for (const field of stepFields(step, flows)) {
          const taken = contract.operations.some(
            (op) =>
              op.inputs.some((input) => input.field === field.id) &&
              op.flowSteps.some((s) => flowOf(s) === step.flow),
          );
          if (!taken) missing.set(`${field.id} (${field.label}) at ${step.id}`, step.flow);
        }
      }
      for (const [where, flow] of missing)
        issues.push(
          fail(
            `${widget.id} asks for ${where}, but no operation serving ${flow} takes it; add it to the inputs of the operation of ${flow} that saves or searches with it.`,
            widget.id,
          ),
        );
    }
    return issues;
  },
);
