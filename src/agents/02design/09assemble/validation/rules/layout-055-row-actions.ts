import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-055 · warning · H-55 Row actions
 * A row of a list or table shows at most three icon buttons, and they come last.
 * Pass: a row ending in Edit and Delete icon buttons.
 * Fail: a row with four icon buttons.
 */
const LISTS = new Set(['list', 'table', 'cards']);

export const rule = defineRule<LayoutInput>(
  'LAYOUT-055',
  'warning',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    const kinds = new Map(screens.sections.map((s) => [s.id, s.kind]));
    for (const row of screens.nodes) {
      if (
        row.layout?.direction !== 'row' ||
        !LISTS.has(kinds.get(row.section) ?? '')
      )
        continue;
      const kids = screens.nodes
        .filter(
          (node) => node.parent === row.id && node.section === row.section,
        )
        .sort((a, b) => a.order - b.order);
      const icons = kids.filter((node) => node.component === 'IconButton');
      const lastOther = kids.findLastIndex(
        (node) => node.component !== 'IconButton',
      );
      const firstIcon = kids.findIndex(
        (node) => node.component === 'IconButton',
      );
      if (icons.length > 3)
        issues.push(
          fail(
            `${row.id} is a row in a ${kinds.get(row.section)} section, with ${icons.length} icon buttons. A row of a list, table or cards section shows at most three icon buttons. Keep three icon buttons in ${row.id}, and put ${icons.length === 4 ? 'the other one' : `the other ${icons.length - 3}`} in a Dropdown.`,
            row.id,
          ),
        );
      if (icons.length && firstIcon < lastOther)
        issues.push(
          fail(
            `${row.id} puts the icon button ${kids[firstIcon]?.id} before ${kids[lastOther]?.id}. The icon buttons of a row come last in it. Give each icon button of ${row.id} a larger order than every other node in ${row.id}.`,
            row.id,
          ),
        );
    }
    return issues;
  },
);
