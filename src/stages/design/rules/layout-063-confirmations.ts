import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import {
  ACTIONS,
  isButton,
  type LayoutInput,
  sentences,
} from './layout-helpers';

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
          ? ''
          : `one sentence (has ${texts.length} text nodes)`,
        names ? '' : 'the sentence names what is destroyed',
        buttons.length === 2 ? '' : `two buttons (has ${buttons.length})`,
      ].filter(Boolean);
      if (problems.length)
        issues.push(
          fail(
            `The confirmation ${screen.id} needs ${problems.join(', ')}.`,
            screen.id,
          ),
        );
    }
    return issues;
  },
);
