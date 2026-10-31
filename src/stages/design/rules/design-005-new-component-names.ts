import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { issue, levenshtein } from '../../../core/rules';
import { dsNames } from '../../../ds/inventory';
import type { IaInput } from './design-helpers';

/**
 * DESIGN-005 · mandatory (a near match is a warning)
 * A new component's name is not a design-system name, ignoring case; a near
 * match (edit distance 2 or less, or one name inside the other) warns.
 * Pass: TitleCover.
 * Fail: Button.
 */
export const rule = defineRule<IaInput>(
  'DESIGN-005',
  'mandatory',
  ({ ia, ctx }, fail) => {
    const issues: Issue[] = [];
    const names = dsNames(ctx.inventory);
    for (const c of ia.newComponents) {
      const own = c.name.toLowerCase();
      const same = names.find((name) => name.toLowerCase() === own);
      if (same) {
        issues.push(
          fail(
            `New component ${c.name} is the design system's ${same}; use ${same} instead.`,
            c.name,
          ),
        );
        continue;
      }
      const near = names.find((name) => {
        const ds = name.toLowerCase();
        return (
          levenshtein(ds, own) <= 2 || ds.includes(own) || own.includes(ds)
        );
      });
      if (near)
        issues.push(
          issue(
            'DESIGN-005',
            'warning',
            `New component ${c.name} is close to the design system's ${near}; check it is not ${near} under another name.`,
            c.name,
          ),
        );
    }
    return issues;
  },
);
