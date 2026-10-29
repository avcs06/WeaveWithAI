/**
 * FLOW-022 · warning
 * A step may mention a simulated capability (payment, upload, attachment, sending email, notifications) only when the scope marks that capability needed.
 * A step may not mention a skipped capability (live, chat, map) unless an assumption or out-of-scope entry explains what the app does instead.
 * Pass: 'Shows the email as sent.' with scope capabilities [{ id: 'emailSending', needed: true }]
 * Fail: the same step when emailSending is not needed · 'Shows the shops on a map.' with nothing about maps in outOfScope or the assumptions
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { eachStep, explanations, type FlowInput } from './helpers';

/** Unsupported capabilities as they show up in prose; "email" only counts when it is being sent. */
export const UNSUPPORTED_MENTIONS: { word: string; pattern: RegExp }[] = [
  { word: 'payment', pattern: /\b(pay|pays|paid|payments?|checkout|invoices?)\b/i },
  { word: 'upload', pattern: /\buploads?(ed|ing)?\b/i },
  { word: 'attach', pattern: /\battach(es|ed|ment|ments)?\b/i },
  { word: 'email', pattern: /\b(sends?|sending|sent|receives?|gets?)\b[^.]{0,40}\bemails?\b|\bemails?\b[^.]{0,20}\b(sent|notifications?|reminders?)\b/i },
  { word: 'notify', pattern: /\bnotif(y|ies|ied|ication|ications)\b/i },
  { word: 'live', pattern: /\b(live|real-?time)\b/i },
  { word: 'chat', pattern: /\bchats?\b/i },
  { word: 'map', pattern: /\bmaps?\b/i },
];

export const rule = defineRule<FlowInput>('FLOW-022', 'warning', (input, fail) => {
  const issues: Issue[] = [];
  const explained = explanations(input).join('\n');
  for (const { step } of eachStep(input.flows)) {
    const text = `${step.userAction} ${step.websiteResponse}`;
    for (const { word, pattern } of UNSUPPORTED_MENTIONS) {
      if (pattern.test(text) && !pattern.test(explained)) {
        issues.push(fail(`${step.id} mentions ${word}, which the MVP does not support; add an out-of-scope entry or assumption that names it and says what the app does instead.`, step.id));
      }
    }
  }
  return issues;
});
