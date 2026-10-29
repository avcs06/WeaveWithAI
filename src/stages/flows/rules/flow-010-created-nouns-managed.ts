/**
 * FLOW-010 · warning
 * A created noun is also updated and deleted somewhere, unless an assumption or out-of-scope entry names the noun to say why not.
 * Pass: Book is created, updated and deleted · Book is created and deleted, with the assumption 'Editing a Book comes after the MVP.'
 * Fail: Book is created and deleted, never updated, and no assumption or out-of-scope entry mentions Book
 */
import type { Issue } from '../../../core/issues';
import { defineRule, escapeRegExp } from '../../../core/rules';
import { eachStep, explanations, type FlowInput } from './helpers';

export const rule = defineRule<FlowInput>(
  'FLOW-010',
  'warning',
  (input, fail) => {
    const issues: Issue[] = [];
    const changes = new Map<string, Set<string>>();
    for (const { step } of eachStep(input.flows)) {
      for (const effect of step.effects) {
        changes.set(
          effect.noun,
          (changes.get(effect.noun) ?? new Set()).add(effect.change),
        );
      }
    }
    const explained = explanations(input).join('\n');
    for (const [noun, kinds] of changes) {
      if (!kinds.has('create')) continue;
      const missing = ['update', 'delete'].filter((kind) => !kinds.has(kind));
      if (missing.length === 0) continue;
      if (new RegExp(`\\b${escapeRegExp(noun)}s?\\b`, 'i').test(explained))
        continue;
      issues.push(
        fail(
          `"${noun}" is created but never ${missing.join(' or ')}d; add the flow, or an assumption or out-of-scope entry saying why ${noun} records stay as they are.`,
        ),
      );
    }
    return issues;
  },
);
