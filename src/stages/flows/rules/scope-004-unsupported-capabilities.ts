/**
 * SCOPE-004 · mandatory
 * A needed capability in skip mode has an outOfScope entry that names it (words from its id or description) and has a placeholder.
 * Build and simulated capabilities are never checked here.
 * Pass: capabilities: [{ id: 'maps', needed: true }] with outOfScope: [{ item: 'Bookshop map', reason: 'Maps are skipped.', placeholder: 'The address is shown as text.' }]
 * Fail: the same capability with outOfScope: [] · an entry about maps whose placeholder is ''
 */
import { type Capability, CAPABILITIES } from '../../../config/capabilities';
import type { Issue } from '../../../core/issues';
import { defineRule, escapeRegExp } from '../../../core/rules';
import type { Scope } from '../schema';

/** Words that name the capability: its id split into words plus its description's longer words, singular or plural. */
function mentionPattern(capability: Capability): RegExp {
  const words = [
    ...capability.id.split(/(?=[A-Z])/),
    ...capability.description.split(/[^a-zA-Z]+/).filter((word) => word.length >= 4),
  ];
  const stems = [...new Set(words.map((word) => word.toLowerCase().replace(/s$/, '')))];
  return new RegExp(`\\b(${stems.map(escapeRegExp).join('|')})s?\\b`, 'i');
}

export const rule = defineRule<Scope>('SCOPE-004', 'mandatory', (scope, fail) => {
  const issues: Issue[] = [];
  for (const entry of scope.capabilities) {
    const capability = CAPABILITIES.find((c) => c.id === entry.id);
    if (!capability || capability.mode !== 'skip' || !entry.needed) continue;
    const pattern = mentionPattern(capability);
    const covered = scope.outOfScope.some(
      (item) => item.placeholder.trim() !== '' && pattern.test(`${item.item} ${item.reason}`),
    );
    if (!covered) {
      issues.push(
        fail(
          `Capability "${entry.id}" is needed but skipped in the MVP and has no outOfScope entry; add one naming ${capability.description} with a placeholder saying what the app does instead.`,
          'outOfScope',
        ),
      );
    }
  }
  return issues;
});
