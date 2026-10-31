import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { LayoutInput } from './layout-helpers';

/**
 * LAYOUT-038 · mandatory · H-38 Cards for repeated items only
 * A Card is one of a set, in a list or cards section; a page is not a card deck
 * and a form is not a card.
 * Pass: three Cards side by side in a cards section.
 * Fail: a Card around the shelf details in a side panel.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-038',
  'mandatory',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    const kinds = new Map(screens.sections.map((s) => [s.id, s.kind]));
    for (const node of screens.nodes) {
      if (node.component !== 'Card') continue;
      const kind = kinds.get(node.section);
      const set = screens.nodes.some(
        (other) =>
          other !== node &&
          other.component === 'Card' &&
          other.section === node.section &&
          other.parent === node.parent,
      );
      if ((kind !== 'list' && kind !== 'cards') || !set)
        issues.push(
          fail(
            `${node.id} is a Card ${set ? '' : 'on its own '}in a ${kind} section; use Cards only for the items of a list or cards section, and plain layout elsewhere.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
