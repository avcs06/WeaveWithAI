import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { Rect } from '../layout';
import type { LayoutInput, View } from './layout-helpers';

/**
 * LAYOUT-030 · warning · H-30 Media ratios
 * The images in a grid share one ratio from 16:9, 4:3, 1:1 or 3:4.
 * Pass: three 20 by 20 icons in a feature grid.
 * Fail: one of them 20 by 12.
 */
const RATIOS = [16 / 9, 4 / 3, 1, 3 / 4];
const close = (a: number, b: number) => Math.abs(a - b) / b < 0.02;
const media = (view: View, rect: Rect): Rect[] =>
  view
    .kids(rect.id)
    .flatMap((kid) =>
      view.node(kid.id)?.role === 'media' ? [kid] : media(view, kid),
    );

export const rule = defineRule<LayoutInput>(
  'LAYOUT-030',
  'warning',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        if (view.layout(rect)?.direction !== 'grid') continue;
        const ratios = media(view, rect).map(
          (m) => m.width / Math.max(m.height, 1),
        );
        const first = ratios[0];
        if (first === undefined) continue;
        if (
          !ratios.every((ratio) => close(ratio, first)) ||
          !RATIOS.some((ratio) => close(first, ratio))
        )
          issues.push(
            fail(
              `The images in ${rect.id} have ratios ${[...new Set(ratios.map((r) => r.toFixed(2)))].join(', ')}; give them one of 16:9, 4:3, 1:1 or 3:4.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
