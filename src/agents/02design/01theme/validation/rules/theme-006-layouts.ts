import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { ACCOUNT, LOGO, positionIn } from '../../../config';
import { spacingPx, type ThemeInput } from '../helpers';

/**
 * THEME-006 · mandatory
 * In each page layout, a needed header, sidebar or footer holds something and
 * a needed sidebar has a width; a fixed container has a width; a header or
 * footer of fixed height fits a button of the default size and its padding;
 * the logo and the account sit in a needed part, named in the slot where
 * they sit: a bar's start, center or end, the sidebar's top for the logo and
 * its bottom for the account.
 * Pass: the reading-list app layout, a header with the logo, the Shelf link
 * and the account.
 * Fail: a needed sidebar 0 wide.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-006',
  'mandatory',
  ({ theme, inventory }, fail) => {
    const issues: Issue[] = [];
    const px = spacingPx(inventory);
    const size = theme.defaults.Button?.size || 'md';
    const box = inventory.components.find((c) => c.name === 'Button')?.box;
    const button = box?.[size]?.height ?? box?.md?.height ?? 0;
    for (const [kind, layout] of Object.entries(theme.layouts)) {
      const { header, sidebar, footer, main } = layout;
      const empty = (part: string) =>
        issues.push(
          fail(
            `The ${kind} ${part} is needed but holds nothing; say what sits in it, or set needed to false.`,
            `${kind}.${part}`,
          ),
        );
      for (const [part, bar] of [
        ['header', header],
        ['footer', footer],
      ] as const) {
        if (bar.needed && !bar.start && !bar.center && !bar.end)
          empty(part);
        const least = button + 2 * px(bar.padding);
        if (bar.needed && bar.heightPx > 0 && bar.heightPx < least)
          issues.push(
            fail(
              `The ${kind} ${part} is ${bar.heightPx} tall, which does not fit a ${button} tall ${size} button and its padding; make it at least ${least}, or 0 to fit its content.`,
              `${kind}.${part}.heightPx`,
            ),
          );
      }
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
      const shown = { header, sidebar, footer } as const;
      // Code places them in the slot that names them.
      const named = (where: 'header' | 'sidebar' | 'footer', what: 'logo' | 'account') => {
        const word = what === 'logo' ? LOGO : ACCOUNT;
        if (where !== 'sidebar') return positionIn(shown[where], word) !== undefined;
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
              `The ${kind} ${what} is in the ${where}, but no slot of it names "the ${what}"; name it in the slot where it sits.`,
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
