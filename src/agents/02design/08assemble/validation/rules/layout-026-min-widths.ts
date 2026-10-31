import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-026 · mandatory · H-26 Minimum widths
 * A field at least 160, a card at least 240, and a node of fixed width fits
 * inside its dialog. A button's width is the design system's and is not checked.
 * Pass: the Title field filling the 472 inside the Add a book dialog.
 * Fail: the Title field fixed at 120.
 */
const CONTROLS = new Set(['Checkbox', 'Radio', 'Switch', 'IconButton', 'Chip']);

export const rule = defineRule<LayoutInput>(
  'LAYOUT-026',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views) {
      const surface =
        view.screen.type === 'page' ? undefined : view.rect(view.screen.id);
      for (const rect of view.rects) {
        const node = view.node(rect.id);
        if (!node) continue;
        const too = (what: string, min: number) =>
          issues.push(
            fail(
              `${rect.id} is ${what} ${Math.round(rect.width)}px wide. ${what === 'a field' ? 'A field' : 'A card'} is at least ${min}px wide. Set the box width of ${rect.id} to fixed with a widthPx of at least ${min}, or let it fill a parent at least ${min}px wide.`,
              rect.id,
            ),
          );
        if (
          node.role === 'input' &&
          node.component !== 'none' &&
          !CONTROLS.has(node.component) &&
          rect.width < 160
        )
          too('a field', 160);
        if (node.component === 'Card' && rect.width < 240) too('a card', 240);
        const inner = surface
          ? surface.width - surface.padding[1] - surface.padding[3]
          : Infinity;
        if (node.box.width === 'fixed' && node.box.widthPx > inner)
          issues.push(
            fail(
              `${rect.id} has a fixed width of ${node.box.widthPx}px, but the inside of the ${view.screen.type} ${view.screen.id} is ${Math.floor(inner)}px wide. A node of fixed width fits inside its ${view.screen.type}. Set the widthPx of ${rect.id} to ${Math.floor(inner)} or less, or give the ${view.screen.type} ${view.screen.id} a wider content width.`,
              rect.id,
            ),
          );
      }
    }
    return issues;
  },
);
