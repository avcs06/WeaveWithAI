import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { allowedWords, traced, words } from '../../../trace';
import type { ArchitectureInput } from '../helpers';

/**
 * ARCH-001 · mandatory
 * Every step of a frame, a screen or a dialog, its alternatives included, names something the scope and the flows have, or what every frame has: the wordmark, the account, the navigation. What the scope says of each record, such as its statuses, and what the flows' alternative paths show count too. A step that names nothing at all passes.
 * Pass: "Can open the account menu, which shows their email and lets them sign out." · "Can choose Sign in, which goes to /sign-in." · "Reads that saving failed and sees the typed values kept."
 * Fail: "Can open Help, which shows help information." with no help in the scope or flows
 */
export const rule = defineRule<ArchitectureInput>('ARCH-001', 'mandatory', ({ architecture, scope, flows }, fail) => {
  // A failed save, a sold-out choice or a record that is gone is told in the words of the flows' own paths and the records' statuses, not their names.
  const allowed = new Set([
    ...allowedWords(scope, flows),
    ...scope.vocabulary.flatMap((entry) => words(entry.description)),
    ...flows.flows
      .flatMap((flow) => flow.alternatives)
      .flatMap((alternative) => [alternative.condition, ...alternative.steps.flatMap((step) => [step.userAction, step.websiteResponse])])
      .flatMap(words),
  ]);
  const issues: Issue[] = [];
  const check = (id: string, steps: string[], at: string) =>
    steps.forEach((step, i) => {
      if (!traced(step, allowed))
        issues.push(
          fail(
            `${id}: "${step}" names nothing the scope and the flows have. A step names what a flow gives the user there; drop what no flow has.`,
            `${at}[${i}]`,
          ),
        );
    });
  for (const place of [...architecture.frames, ...architecture.screens, ...architecture.dialogs]) {
    check(place.id, place.steps, `${place.id}.steps`);
    place.alternatives.forEach((alternative, j) => check(place.id, alternative.steps, `${place.id}.alternatives[${j}].steps`));
  }
  return issues;
});
