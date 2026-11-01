import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { modesOf, setName } from '../../schema';
import type { CallInput } from '../helpers';

/**
 * THEME-010 · mandatory
 * The colors hold each mode the brief's color scheme names, once, and no
 * other, and each mode a set for each colored entity, once, and no other.
 * The brief and its values come in one answer, so the schema cannot
 * hold the colors to the brief.
 * Pass: a dark-only brief with one dark mode, holding a set for its one colored noun.
 * Fail: the same brief whose colors also hold a light mode.
 */
export const rule = defineRule<CallInput>('THEME-010', 'mandatory', ({ call }, fail) => {
  const { brief, colors } = call;
  const named = modesOf(brief);
  const issues: Issue[] = [];
  for (const mode of named) {
    const count = colors.filter((c) => c.mode === mode).length;
    if (count !== 1)
      issues.push(fail(`colors holds the ${mode} mode ${count} times. The brief's colorScheme is ${brief.colorScheme}, so colors holds the ${mode} mode exactly once. ${count ? `Keep one ${mode} mode.` : `Add the ${mode} mode.`}`, `colors.${mode}`));
  }
  for (const extra of colors.filter((c) => !named.includes(c.mode)))
    issues.push(fail(`colors holds a ${extra.mode} mode, but the brief's colorScheme is ${brief.colorScheme}. Drop the ${extra.mode} mode, or set colorScheme to both.`, `colors.${extra.mode}`));
  const colored = brief.entities.filter((e) => e.colored).map((e) => e.noun);
  for (const { mode, entities } of colors.filter((c) => named.includes(c.mode))) {
    for (const noun of colored) {
      const count = entities.filter((e) => setName(e.noun) === setName(noun)).length;
      if (count !== 1)
        issues.push(fail(`colors ${mode} holds ${count} sets for ${noun}. Each colored entity of the brief has exactly one set in each mode. ${count ? `Keep one set for ${noun}.` : `Add a set for ${noun} to entities.`}`, `colors.${mode}.entities`));
    }
    for (const { noun } of entities.filter((e) => !colored.some((c) => setName(c) === setName(e.noun))))
      issues.push(fail(`colors ${mode} holds a set for ${noun}, which the brief does not color. A mode holds sets only for the colored entities: ${colored.join(', ') || 'none'}. Drop the set for ${noun}, or color ${noun} in the brief.`, `colors.${mode}.entities`));
  }
  return issues;
});
