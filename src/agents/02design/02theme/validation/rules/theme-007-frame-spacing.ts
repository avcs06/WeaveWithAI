import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { SECTION_GAP_PX } from '../../../config';
import { sizes } from '../../../09assemble/skeleton/boxes';
import type { ThemeInput } from '../helpers';

/**
 * THEME-007 · mandatory
 * The spacing a layout gives every page of its kind, which no later call can
 * change: sections 24 to 32 apart on app pages and 24 to 48 on marketing pages
 * (H-08), and the main area and each needed part padded at least as much as
 * the gap inside them (H-06).
 * Pass: the reading-list layouts, sections 24 apart in a padding of 24.
 * Fail: app sections 16 apart.
 */
export const rule = defineRule<ThemeInput>(
  'THEME-007',
  'mandatory',
  ({ theme, inventory }, fail) => {
    const issues: Issue[] = [];
    const px = sizes(inventory, []).spacing;
    for (const kind of ['app', 'marketing'] as const) {
      const { main, header, sidebar, extraSidebar, footer } =
        theme.layouts[kind];
      const [low, high] = SECTION_GAP_PX[kind];
      const sectionGap = px(main.sectionGap);
      if (sectionGap < low || sectionGap > high)
        issues.push(
          fail(
            `The ${kind} sections are ${sectionGap} apart; keep them ${low} to ${high} apart.`,
            `${kind}.main.sectionGap`,
          ),
        );

      const padded: [string, number, number][] = [
        ['main', px(main.padding), sectionGap],
      ];
      for (const [name, part] of Object.entries({
        header,
        sidebar,
        extraSidebar,
        footer,
      }))
        if (part.needed) padded.push([name, px(part.padding), px(part.gap)]);
      for (const [name, padding, gap] of padded)
        if (padding > 0 && gap > padding)
          issues.push(
            fail(
              `The ${kind} ${name} has padding ${padding} but a gap of ${gap} inside it; the padding is never smaller than the gap.`,
              `${kind}.${name}.padding`,
            ),
          );
    }
    return issues;
  },
);
