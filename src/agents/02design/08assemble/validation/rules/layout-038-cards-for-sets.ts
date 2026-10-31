import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-038 · mandatory · H-38 Cards for repeated items only
 * A Card is one of a set, in a list or cards section; a page is not a card deck
 * and a form is not a card. A Card in a CardGroup is an option, the group its set.
 * Pass: three Cards side by side in a cards section.
 * Fail: a Card around the shelf details in a side panel.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-038',
  'mandatory',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    const kinds = new Map(screens.sections.map((s) => [s.id, s.kind]));
    const byId = new Map(screens.nodes.map((n) => [n.id, n]));
    const choice = (node: { parent: string }) => byId.get(node.parent)?.component === 'CardGroup';
    for (const node of screens.nodes) {
      // A Card in a CardGroup is one option of a choice: the group is its set.
      if (node.component !== 'Card' || choice(node)) continue;
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
            `${node.id} is a Card ${set ? 'in' : 'alone in'} a section of kind ${kind}. A Card is one of two or more Cards in the same parent, in a list or cards section. Set the component of ${node.id} to none, so it is a plain layout box.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
