import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { LayoutInput } from './layout-helpers';

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
            `${row.id} shows ${icons.length} icon buttons; show at most three and put the rest in a dropdown.`,
            row.id,
          ),
        );
      if (icons.length && firstIcon < lastOther)
        issues.push(
          fail(
            `${row.id} puts its icon buttons before other content; row actions come last.`,
            row.id,
          ),
        );
    }
    return issues;
  },
);
