/**
 * FLOW-008 · mandatory
 * Effect nouns are vocabulary nouns from the scope, spelled exactly.
 * Pass: effects: [{ noun: 'Book', change: 'create' }] when the scope has 'Book'
 * Fail: { noun: 'book' } · { noun: 'Novel' }
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>('FLOW-008', 'mandatory', ({ flows, scope }, fail) => {
  const issues: Issue[] = [];
  const nouns = scope.vocabulary.map((entry) => entry.noun);
  for (const { step } of eachStep(flows)) {
    for (const effect of step.effects) {
      if (!nouns.includes(effect.noun)) {
        issues.push(fail(`${step.id} ${effect.change}s "${effect.noun}", which is not a vocabulary noun; use one of ${nouns.join(', ')}.`, step.id));
      }
    }
  }
  return issues;
});
