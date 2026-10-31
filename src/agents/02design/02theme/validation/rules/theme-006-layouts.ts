import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { sizes } from '../../../09assemble/skeleton/boxes';
import type { ThemeInput } from '../helpers';

/**
 * THEME-006 · mandatory
 * In each page layout, a needed header, sidebar or footer holds something and
 * a needed sidebar has a width; the two sidebars sit on different sides; a
 * fixed container has a width; a header or footer of fixed height fits at
 * least the smallest button and its padding (LAYOUT-071 measures the rest).
 * Pass: the reading-list app layout, a header with the wordmark and the shelf.
 * Fail: a needed sidebar 0 wide.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-006',
  'mandatory',
  ({ theme, inventory }, fail) => {
    const issues: Issue[] = [];
    const px = sizes(inventory, []).spacing;
    const button = Math.min(
      ...Object.values(
        inventory.components.find((c) => c.name === 'Button')?.box ?? {},
      ).flatMap((box) => (box.height ? [box.height] : [])),
    );
    for (const [kind, layout] of Object.entries(theme.layouts)) {
      const { header, sidebar, extraSidebar, footer, main } = layout;
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
              `The ${kind} ${part} is ${bar.heightPx} tall, which does not fit a ${button} tall button and its padding; make it at least ${least}, or 0 to fit its content.`,
              `${kind}.${part}.heightPx`,
            ),
          );
      }
      for (const [part, side] of [
        ['sidebar', sidebar],
        ['extraSidebar', extraSidebar],
      ] as const) {
        if (!side.needed) continue;
        if (!side.top && !side.bottom) empty(part);
        if (side.widthPx <= 0)
          issues.push(
            fail(
              `The ${kind} ${part} is ${side.widthPx} wide; give it a width in px.`,
              `${kind}.${part}.widthPx`,
            ),
          );
      }
      if (sidebar.needed && extraSidebar.needed && sidebar.side === extraSidebar.side)
        issues.push(
          fail(
            `Both ${kind} sidebars are on the ${sidebar.side}; put the extra sidebar on the other side.`,
            `${kind}.extraSidebar.side`,
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
