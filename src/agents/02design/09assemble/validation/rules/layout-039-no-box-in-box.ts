import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { BORDERED, type LayoutInput } from '../helpers';

/**
 * LAYOUT-039 · mandatory · H-39 No box in a box
 * A bordered component (Card, Section, Accordion, Popover) never sits inside
 * another or inside a dialog.
 * Pass: Cards directly in a page section.
 * Fail: a Card inside a dialog.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-039',
  'mandatory',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    const byId = new Map(screens.nodes.map((node) => [node.id, node]));
    const screenOf = new Map(
      screens.sections.map((s) => [
        s.id,
        screens.screens.find((screen) => screen.id === s.screen),
      ]),
    );
    for (const node of screens.nodes) {
      if (!BORDERED.has(node.component)) continue;
      const seen = new Set<string>();
      let outer = byId.get(node.parent);
      while (outer && !BORDERED.has(outer.component) && !seen.has(outer.id)) {
        seen.add(outer.id);
        outer = byId.get(outer.parent);
      }
      const screen = screenOf.get(node.section);
      if (outer && BORDERED.has(outer.component))
        issues.push(
          fail(
            `${node.id} is a ${node.component} inside the ${outer.component} ${outer.id}; a box in a box is a defect, so drop one border.`,
            node.id,
          ),
        );
      else if (screen && screen.type !== 'page')
        issues.push(
          fail(
            `${node.id} is a ${node.component} inside the ${screen.type} ${screen.id}; the ${screen.type} is the box, so lay its content out plainly.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
