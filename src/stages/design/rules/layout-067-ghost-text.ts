import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import {
  isButton,
  isColumn,
  type LayoutInput,
  lineStarts,
} from './layout-helpers';

/**
 * LAYOUT-067 · mandatory · H-67 Ghost controls align by their text
 * In a column, a ghost control's text (its x plus its padding) lines up with the
 * text that starts the other lines.
 * Pass: ghost buttons only in rows.
 * Fail: a ghost Return to shelf button above the page title, its text 8 in from the title.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-067',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const layout = view.layout(rect);
        if (!layout || !isColumn(layout) || view.kids(rect.id).length < 2)
          continue;
        const starts = lineStarts(view, rect);
        const texts = starts.filter((leaf) => leaf.kind === 'text');
        for (const ghost of starts) {
          const node = view.node(ghost.id);
          if (!isButton(node) || !node?.look.split(' ').includes('ghost'))
            continue;
          const edge = ghost.x + ghost.padding[3];
          const off = texts.find((text) => Math.abs(text.x - edge) > 0.5);
          if (off)
            issues.push(
              fail(
                `The ghost ${ghost.id} starts its text at ${Math.round(edge - rect.x)} in ${rect.id}, but ${off.id} starts at ${Math.round(off.x - rect.x)}; give the text a matching margin or the control a negative one.`,
                ghost.id,
              ),
            );
        }
      }
    return issues;
  },
);
