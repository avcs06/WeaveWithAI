import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { ScreenInput } from './helpers';

/**
 * DESIGN-037 · mandatory
 * A screen's boxes nest at most three levels, and every row fits: its items'
 * minimum widths and the gaps between them stay within the screen's content
 * width. The minimums are the catalog's, added up by code.
 * Pass: a 640 list beside a 280 panel in a 960 column, 24 apart.
 * Fail: the same row in a 640 column.
 */
export const rule = defineRule<ScreenInput>(
  'DESIGN-037',
  'mandatory',
  ({ layout, catalog, width, gapPx }, fail) => {
    const issues: Issue[] = [];
    const parentOf = new Map(layout.boxes.map((b) => [b.id, b.parent]));
    const depth = (id: string): number => (id ? 1 + depth(parentOf.get(id) ?? '') : 0);
    for (const box of layout.boxes)
      if (depth(box.id) > 3)
        issues.push(fail(`${box.id} is ${depth(box.id)} boxes deep. Boxes nest at most 3 levels deep. Take out a box above ${box.id}, so that no box is more than 3 boxes deep.`, box.id));
    const minOf = new Map<string, number>([
      ...catalog.widgets.map((w) => [w.id, w.minWidthPx] as const),
      ...catalog.components.map((c) => [c.name, c.minWidthPx] as const),
    ]);
    const needs = (id: string): number => {
      const box = layout.boxes.find((b) => b.id === id);
      const kids = [
        ...layout.boxes.filter((b) => b.parent === id).map((b) => (b.size === 'fixed' ? b.widthPx : needs(b.id))),
        ...layout.instances
          .filter((i) => i.in === id)
          .map((i) => (i.size === 'fixed' ? i.widthPx : (minOf.get(i.places) ?? 0))),
      ];
      if (!kids.length) return 0;
      return box?.direction === 'row'
        ? kids.reduce((sum, w) => sum + w, 0) + gapPx * (kids.length - 1)
        : Math.max(...kids);
    };
    for (const id of ['', ...layout.boxes.map((b) => b.id)]) {
      const box = layout.boxes.find((b) => b.id === id);
      if (id && box?.direction !== 'row') continue;
      const need = needs(id);
      if (need > width + 0.5)
        issues.push(
          fail(
            `${id || layout.screen} needs ${Math.round(need)}px for its items' minimum widths and the gaps between them, but the content width of ${layout.screen} is ${Math.round(width)}px. Every row fits within the screen's content width. ${id ? `Make ${id} a column so its items stack, or put fewer or narrower items in it.` : `Make each box and instance at the top of ${layout.screen} fit in ${Math.round(width)}px.`}`,
            id || layout.screen,
          ),
        );
    }
    return issues;
  },
);
