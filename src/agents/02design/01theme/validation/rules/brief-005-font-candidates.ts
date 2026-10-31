import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { BriefInput } from '../helpers';

/**
 * BRIEF-005 · mandatory
 * Each font role lists three different families, best first; the first is the one used.
 * Pass: ui Inter, Open Sans, Roboto.
 * Fail: ui Inter alone, or Inter twice.
 */
export const rule = defineRule<BriefInput>(
  'BRIEF-005',
  'mandatory',
  ({ brief }, fail) => {
    const issues: Issue[] = [];
    for (const [role, picks] of Object.entries(brief.fonts)) {
      const families = new Set(picks.map((pick) => pick.family));
      if (picks.length !== 3 || families.size !== 3)
        issues.push(
          fail(
            `fonts.${role} lists ${picks.length} candidates with ${families.size} different families; list three different families, best first.`,
            `fonts.${role}`,
          ),
        );
    }
    return issues;
  },
);
