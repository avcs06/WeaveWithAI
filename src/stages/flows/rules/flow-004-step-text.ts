/**
 * FLOW-004 · mandatory
 * Every step has a websiteResponse; a user step has a userAction; a system step has userAction "". A step that runs a subflow has neither text, no fields and no effects: the subflow carries them.
 * Pass: { kind: 'user', userAction: 'Clicks Add', websiteResponse: 'Shows the form.' } · { subflow: 'SF01', userAction: '', websiteResponse: '', fields: [], effects: [] }
 * Fail: { kind: 'user', userAction: '' } · { websiteResponse: '' } · { subflow: 'SF01', websiteResponse: 'Shows...' }
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
      if (step.subflow !== '') {
        const carried = [
          step.userAction !== '' && 'a userAction',
          step.websiteResponse !== '' && 'a websiteResponse',
          (step.fields.length > 0 || step.form !== '') && 'fields',
          step.effects.length > 0 && 'effects',
        ].filter((item): item is string => typeof item === 'string');
        if (carried.length > 0) {
          issues.push(
            fail(
              `${step.id} runs subflow ${step.subflow} but also has ${carried.join(', ')}; a subflow step carries nothing of its own.`,
              step.id,
            ),
          );
        }
        continue;
      }
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
