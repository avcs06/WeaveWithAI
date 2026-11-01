import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { ACTIONS, isButton, type LayoutInput } from '../helpers';

/**
 * LAYOUT-063 · mandatory · H-63 Confirmations
 * A confirmation, a dialog or drawer whose one job is a destructive action (no
 * inputs, no primary action), has one text node and two buttons. An edit
 * drawer with a Delete button is not one. Its words are checked by DESIGN-048,
 * where the screen and draw calls write them; the shape
 * is checked here, since a dialog's widgets come together only on assembly.
 * Pass: "This removes “The Left Hand of Darkness” from your shelf for good.", Cancel, Delete book.
 * Fail: the same with a third button.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-063',
  'mandatory',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    for (const screen of screens.screens) {
      if (screen.type === 'page') continue;
      const sections = new Set(
        screens.sections.filter((s) => s.screen === screen.id).map((s) => s.id),
      );
      const nodes = screens.nodes.filter((node) => sections.has(node.section));
      const confirms =
        nodes.some((node) => node.role === 'destructive-action') &&
        !nodes.some(
          (node) => node.role === 'input' || node.role === 'primary-action',
        );
      if (!confirms) continue;
      const texts = nodes.filter((node) => node.role === 'text');
      const buttons = nodes.filter(
        (node) => isButton(node) || ACTIONS.has(node.role),
      );
      const problems = [
        texts.length === 1
          ? []
          : [`${texts.length} text nodes`, `Give ${screen.id} exactly one text node.`],
        buttons.length === 2
          ? []
          : [`${buttons.length} buttons`, `Give ${screen.id} exactly two buttons.`],
      ].filter((pair) => pair.length);
      if (problems.length)
        issues.push(
          fail(
            `${screen.id} is a confirmation, a ${screen.type} whose one job is a destructive action. It has ${new Intl.ListFormat('en-GB').format(problems.map(([wrong]) => wrong ?? ''))}. A confirmation shows one sentence in one text node, and offers two buttons. ${problems.map(([, fix]) => fix).join(' ')}`,
            screen.id,
          ),
        );
    }
    return issues;
  },
);
