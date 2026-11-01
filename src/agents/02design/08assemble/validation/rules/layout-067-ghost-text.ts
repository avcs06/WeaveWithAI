import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import {
  isButton,
  isColumn,
  type LayoutInput,
  lineStarts,
} from '../helpers';

/**
 * LAYOUT-067 · warning · H-67 Ghost controls align by their text
 * In a column, a ghost control's text (its x plus its padding) lines up with the
 * text that starts the other lines.
 * A warning: it is polish, and fixes left it in place.
 * Pass: ghost buttons only in rows.
 * Fail: a ghost Return to shelf button above the page title, its text 8 in from the title.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-067',
  'warning',
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
                `The ghost button ${ghost.id} starts its text ${Math.round(edge - rect.x)}px in from the left of ${rect.id}, but the text ${off.id} starts ${Math.round(off.x - rect.x)}px in. In a column, the text of a ghost control lines up with the text that starts the other lines. ${edge > off.x ? `Put ${off.id} and the other text that starts a line in ${rect.id} in a box with layout padding ${Math.round(edge - off.x)}px` : `Put ${ghost.id} in a box with layout padding ${Math.round(off.x - edge)}px`}, so the text edges match.`,
                ghost.id,
              ),
            );
        }
      }
    return issues;
  },
);
