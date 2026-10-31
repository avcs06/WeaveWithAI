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
const CONTROLS = new Set(['Checkbox', 'Radio', 'Switch', 'IconButton']);

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
              `${rect.id} is ${Math.round(rect.width)} wide; ${what} is at least ${min}.`,
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
              `${rect.id} is fixed at ${node.box.widthPx}, wider than the ${inner} inside the dialog; narrow it or give the dialog a wider content width.`,
              rect.id,
            ),
          );
      }
    }
    return issues;
  },
);
