import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { BORDERED, type LayoutInput } from '../helpers';

/**
 * LAYOUT-039 · mandatory · H-39 No box in a box
 * A bordered component (Card, Section, Accordion, Popover) never sits inside
 * another or inside a dialog. A Card in a CardGroup is an option of a field.
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
      // A Card in a CardGroup is an option of a field, not a box.
      if (!BORDERED.has(node.component) || (node.component === 'Card' && byId.get(node.parent)?.component === 'CardGroup')) continue;
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
            `${node.id} has component ${node.component}, and it sits inside ${outer.id}, which has component ${outer.component}. A Card, Section, Accordion or Popover draws a border, and never sits inside another one of these. Keep one of the two borders. Set the component of ${node.id} to none, so it is a plain layout box, or set the component of ${outer.id} to none.`,
            node.id,
          ),
        );
      else if (screen && screen.type !== 'page')
        issues.push(
          fail(
            `${node.id} has component ${node.component}, and it sits inside the ${screen.type} ${screen.id}. A ${screen.type} already draws the box, so nothing inside it is a Card, Section, Accordion or Popover. Set the component of ${node.id} to none, so it is a plain layout box.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
