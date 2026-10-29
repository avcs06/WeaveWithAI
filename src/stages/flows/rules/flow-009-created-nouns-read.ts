/**
 * FLOW-009 · mandatory
 * Every noun some step creates is listed or read by some step.
 * Pass: F03 creates Book and F04 lists Book
 * Fail: a step creates Shelf and no step lists or reads Shelf
 */
import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { eachStep, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>('FLOW-009', 'mandatory', ({ flows }, fail) => {
  const issues: Issue[] = [];
  const created = new Set<string>();
  const shown = new Set<string>();
  for (const { step } of eachStep(flows)) {
    for (const effect of step.effects) {
      if (effect.change === 'create') created.add(effect.noun);
      if (effect.change === 'list' || effect.change === 'read') shown.add(effect.noun);
    }
  }
  for (const noun of created) {
    if (!shown.has(noun)) {
      issues.push(fail(`"${noun}" is created but never listed or read; add a step that lists or shows ${noun} records.`));
    }
  }
  return issues;
});
