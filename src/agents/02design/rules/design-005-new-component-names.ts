import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { issue, levenshtein } from '../../../core/rules';
import { dsNames } from '../../../ds/inventory';
import type { IaInput } from './helpers';

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
            `New component ${c.name} has the name of the design system's ${same}, ignoring case. A new component has a name of its own, unlike every design-system name. Use ${same} instead, and drop ${c.name} from newComponents.`,
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
            `New component ${c.name} has a name close to the design system's ${near}: at most 2 edits apart, or one name inside the other. A new component is never a design-system component under another name. If ${c.name} is ${near}, use ${near} instead and drop ${c.name} from newComponents.`,
            c.name,
          ),
        );
    }
    return issues;
  },
);
