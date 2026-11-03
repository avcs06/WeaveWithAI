import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { ACCOUNT, LOGO, positionIn } from '../../../config';
import { footerSlots } from '../../schema';
import type { ThemeInput } from '../helpers';

/**
 * THEME-006 · mandatory
 * In each page layout, a needed header, sidebar or footer holds something and
 * a needed sidebar has a width; a fixed container has a width; the logo and
 * the account sit in a needed header or sidebar, named in the slot where they
 * sit: the header's start, center or end, the sidebar's top for the logo and
 * its bottom for the account.
 * Pass: the reading-list app layout, a header with logo at its start and
 * "Shelf link, account" at its end.
 * Fail: a needed sidebar 0 wide.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-006',
  'mandatory',
  ({ theme }, fail) => {
    const issues: Issue[] = [];
    for (const [kind, layout] of Object.entries(theme.layouts)) {
      const { header, sidebar, footer, main } = layout;
      const empty = (part: string) =>
        issues.push(
          fail(
            `The ${kind} ${part} is needed but holds nothing; say what sits in it, or set needed to false.`,
            `${kind}.${part}`,
          ),
        );
      if (header.needed && !header.start && !header.center && !header.end)
        empty('header');
      if (footer.needed && !Object.values(footerSlots(footer)).some(Boolean))
        empty('footer');
      if (sidebar.needed) {
        if (!sidebar.top && !sidebar.items && !sidebar.bottom) empty('sidebar');
        if (sidebar.widthPx <= 0)
          issues.push(
            fail(
              `The ${kind} sidebar is ${sidebar.widthPx} wide; give it a width in px.`,
              `${kind}.sidebar.widthPx`,
            ),
          );
      }
      const shown = { header, sidebar } as const;
      // Code places them in the slot that names them.
      const named = (where: 'header' | 'sidebar', what: 'logo' | 'account') => {
        const word = what === 'logo' ? LOGO : ACCOUNT;
        if (where === 'header') return positionIn(header, word) !== undefined;
        return word.test(what === 'logo' ? sidebar.top : sidebar.bottom);
      };
      for (const [what, where] of [
        ['logo', layout.logo],
        ['account', layout.account],
      ] as const)
        if (where !== 'none' && !shown[where].needed)
          issues.push(
            fail(
              `The ${kind} ${what} is in the ${where}, which is not needed; put it in a needed part, or make the ${where} needed.`,
              `${kind}.${what}`,
            ),
          );
        else if (where !== 'none' && !named(where, what))
          issues.push(
            fail(
              `The ${kind} ${what} is in the ${where}, but no slot of it names ${what}; write ${what} in the slot where it sits.`,
              `${kind}.${where}`,
            ),
          );
      if (main.container === 'fixed' && main.maxWidthPx <= 0)
        issues.push(
          fail(
            `The ${kind} container is fixed with no width; give maxWidthPx, or make it fluid.`,
            `${kind}.main.maxWidthPx`,
          ),
        );
    }
    return issues;
  },
);
