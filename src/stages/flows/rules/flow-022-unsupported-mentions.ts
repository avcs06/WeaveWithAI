/**
 * FLOW-022 · warning
 * A step may mention a simulated capability (payment, upload, attachment, sending email, notifications) only when the scope marks that capability needed.
 * A step may not mention a skipped capability (live, chat, map) unless an assumption or out-of-scope entry explains what the app does instead.
 * Pass: 'Shows the email as sent.' with scope capabilities [{ id: 'emailSending', needed: true }]
 * Fail: the same step when emailSending is not needed · 'Shows the shops on a map.' with nothing about maps in outOfScope or the assumptions
 */
import { capability } from '../../../config/capabilities';
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { eachStep, explanations, type FlowInput } from './helpers';

/** Simulated and skipped capabilities as they show up in prose; "email" only counts when it is being sent. */
export const CAPABILITY_MENTIONS: { id: string; word: string; pattern: RegExp }[] = [
  { id: 'payments', word: 'payment', pattern: /\b(pay|pays|paid|payments?|checkout|invoices?)\b/i },
  { id: 'fileUploads', word: 'upload', pattern: /\buploads?(ed|ing)?\b/i },
  { id: 'fileUploads', word: 'attach', pattern: /\battach(es|ed|ment|ments)?\b/i },
  { id: 'emailSending', word: 'email', pattern: /\b(sends?|sending|sent|receives?|gets?)\b[^.]{0,40}\bemails?\b|\bemails?\b[^.]{0,20}\b(sent|notifications?|reminders?)\b/i },
  { id: 'emailSending', word: 'notify', pattern: /\bnotif(y|ies|ied|ication|ications)\b/i },
  { id: 'realtime', word: 'live', pattern: /\b(live|real-?time)\b/i },
  { id: 'realtime', word: 'chat', pattern: /\bchats?\b/i },
  { id: 'maps', word: 'map', pattern: /\bmaps?\b/i },
];

/** A simulated capability may appear in steps once the scope needs it; a skipped one never, unless the scope explains what the app does instead. */
export const rule = defineRule<FlowInput>('FLOW-022', 'warning', (input, fail) => {
  const issues: Issue[] = [];
  const explained = explanations(input).join('\n');
  const needed = new Set(input.scope.capabilities.filter((entry) => entry.needed).map((entry) => entry.id));
  for (const { step } of eachStep(input.flows)) {
    const text = `${step.userAction} ${step.websiteResponse}`;
    for (const { id, word, pattern } of CAPABILITY_MENTIONS) {
      if (!pattern.test(text)) continue;
      const mode = capability(id)?.mode;
      if (mode === 'simulate' && !needed.has(id)) {
        issues.push(fail(`${step.id} mentions ${word}, but the scope does not mark ${id} as needed; mark it needed in the scope (it is simulated: ${capability(id)?.placeholder}) or drop it from the step.`, step.id));
      } else if (mode === 'skip' && !pattern.test(explained)) {
        issues.push(fail(`${step.id} mentions ${word}, which the MVP skips; write what the app does instead, as the scope's out-of-scope entry or an assumption says.`, step.id));
      }
    }
  }
  return issues;
});
