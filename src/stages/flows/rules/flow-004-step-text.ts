/**
 * FLOW-004 · mandatory
 * Every step has a websiteResponse; a user step has a userAction; a system step has userAction "".
 * Pass: { kind: 'user', userAction: 'Clicks Add', websiteResponse: 'Shows the form.' } · { kind: 'system', userAction: '', websiteResponse: 'Marks the book overdue.' }
 * Fail: { kind: 'user', userAction: '' } · { websiteResponse: '' } · { kind: 'system', userAction: 'Waits a day' }
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-004',
  'mandatory',
  ({ flows }, fail) => {
    const issues: Issue[] = [];
    for (const { step } of eachStep(flows)) {
      if (step.websiteResponse.trim() === '') {
        issues.push(
          fail(
            `${step.id} has no websiteResponse; say what the user sees or what changes.`,
            step.id,
          ),
        );
      }
      if (step.kind === 'user' && step.userAction.trim() === '') {
        issues.push(
          fail(
            `${step.id} is a user step with no userAction; say what the user does, or make it a system step.`,
            step.id,
          ),
        );
      }
      if (step.kind === 'system' && step.userAction !== '') {
        issues.push(
          fail(
            `${step.id} is a system step but has a userAction; system steps keep userAction "".`,
            step.id,
          ),
        );
      }
    }
    return issues;
  },
);
