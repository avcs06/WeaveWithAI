import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { spacingPx, type ThemeInput } from '../helpers';

/**
 * THEME-006 · mandatory
 * In each page layout, a needed header, sidebar or footer holds something and
 * a needed sidebar has a width; a fixed container has a width; a header or
 * footer of fixed height fits a button of the default size and its padding.
 * Pass: the reading-list app layout, a header with the wordmark and the shelf.
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
