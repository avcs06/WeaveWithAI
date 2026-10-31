import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import {
  ACTIONS,
  isButton,
  type LayoutInput,
  sentences,
} from '../helpers';

/**
 * LAYOUT-063 · mandatory · H-63 Confirmations
 * A confirmation, a dialog or drawer whose one job is a destructive action (no
 * inputs, no primary action), says one sentence that names what is destroyed,
 * and offers two buttons. An edit drawer with a Delete button is not one.
 * Pass: "This removes “The Left Hand of Darkness” from your shelf for good.", Cancel, Delete book.
 * Fail: the same with a second sentence.
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
      const text = texts[0];
      const names = Boolean(
        text && (text.data.length || /[“"«]/.test(text.text)),
      );
      const problems = [
        texts.length === 1 && text && sentences(text.text) === 1
          ? []
          : [
              texts.length === 1 && text
                ? `a text of ${sentences(text.text)} sentences`
                : `${texts.length} text nodes`,
              `Give ${screen.id} exactly one text node, of one sentence.`,
            ],
        names
          ? []
          : [
              'a text that does not name what is destroyed',
              "Name what is destroyed in that sentence. Show the record's value through its data, as Noun.attribute, or put the record's name in quotes.",
            ],
        buttons.length === 2
          ? []
          : [`${buttons.length} buttons`, `Give ${screen.id} exactly two buttons.`],
      ].filter((pair) => pair.length);
      if (problems.length)
        issues.push(
          fail(
            `${screen.id} is a confirmation, a ${screen.type} whose one job is a destructive action. It has ${new Intl.ListFormat('en-GB').format(problems.map(([wrong]) => wrong ?? ''))}. A confirmation says one sentence that names what is destroyed, and offers two buttons. ${problems.map(([, fix]) => fix).join(' ')}`,
            screen.id,
          ),
        );
    }
    return issues;
  },
);
