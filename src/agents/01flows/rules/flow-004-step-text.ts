/**
 * FLOW-004 · mandatory
 * A user step has a userAction, a system step has userAction "". Every step has a websiteResponse, except one that runs a subflow: its userAction is what triggers the subflow, the subflow's steps answer, and it carries no fields; its effects are what the subflow changes in this flow.
 * Pass: { kind: 'user', userAction: 'Clicks Add', websiteResponse: 'Shows the form.' } · { kind: 'user', userAction: 'Chooses Delete on the book.', subflow: 'STD01', websiteResponse: '', fields: [], effects: [{ noun: 'Book', change: 'delete' }] }
 * Fail: { kind: 'user', userAction: '' } · { websiteResponse: '' } · { subflow: 'SF01', websiteResponse: 'Shows...' } · { kind: 'user', userAction: '', subflow: 'STD01' }
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
          step.websiteResponse !== '' && 'a websiteResponse',
          (step.fields.length > 0 || step.form !== '') && 'fields',
        ].filter((item): item is string => typeof item === 'string');
        if (carried.length > 0) {
          issues.push(
            fail(
              `${step.id} runs subflow ${step.subflow} but also has ${carried.join(', ')}; a subflow step carries only what triggers it and its effects.`,
              step.id,
            ),
          );
        }
      } else if (step.websiteResponse.trim() === '') {
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
            `${step.id} is a user step with no userAction; say what the user does (what triggers the subflow, when it runs one), or make it a system step.`,
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
