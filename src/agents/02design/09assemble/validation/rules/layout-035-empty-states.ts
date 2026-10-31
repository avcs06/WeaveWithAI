import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { ACTIONS, type LayoutInput, sentences } from '../helpers';

/**
 * LAYOUT-035 · mandatory · H-35 Empty states are composed
 * What a list shows when it is empty has one icon or illustration, one
 * sentence and one action, centred. Those are the nodes a list, table or cards
 * section shows only when empty, or every node of an empty-state section: a
 * list widget holds its own empty state (DR08, DS31). A one-line empty message
 * inside another widget, such as a card's notes, is not checked (user,
 * 2026-10-31).
 * Pass: a book icon, "No books yet: add the first one you mean to read.", an Add book button, centred.
 * Fail: the same without the icon.
 */
const LISTS = new Set(['list', 'table', 'cards']);

export const rule = defineRule<LayoutInput>(
  'LAYOUT-035',
  'mandatory',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    for (const section of screens.sections) {
      const own = screens.nodes.filter((node) => node.section === section.id);
      const nodes =
        section.kind === 'empty-state'
          ? own
          : LISTS.has(section.kind)
            ? own.filter((node) => node.states.includes('empty') && !node.states.includes('default'))
            : [];
      if (!nodes.length) continue;
      const ids = new Set(nodes.map((node) => node.id));
      const tops = nodes.filter((node) => !ids.has(node.parent));
      // What centres them: the one box that holds them all, or the box they sit in.
      const holder = tops.length === 1 && tops[0]?.layout ? tops[0] : undefined;
      const parent = holder ?? own.find((node) => node.id === tops[0]?.parent);
      const layout = parent?.layout ?? section.layout;
      const media = nodes.filter((node) => node.role === 'media').length;
      const texts = nodes.filter((node) => node.role === 'text');
      const actions = nodes.filter(
        (node) => ACTIONS.has(node.role) || node.role === 'navigation',
      ).length;
      const at = holder?.id ?? section.id;
      const missing = [
        media === 1
          ? []
          : [`${media} icons or illustrations`, `Give ${at} exactly one icon or illustration.`],
        texts.length === 1 && sentences(texts[0]?.text ?? '') === 1
          ? []
          : [
              texts.length === 1
                ? `a text of ${sentences(texts[0]?.text ?? '')} sentences`
                : `${texts.length} text nodes`,
              `Give ${at} exactly one text node, of one sentence.`,
            ],
        actions === 1 ? [] : [`${actions} actions`, `Give ${at} exactly one action.`],
        layout.align === 'center'
          ? []
          : [
              `content with layout align ${layout.align}`,
              `Set the layout align of ${parent?.layout ? parent.id : section.id} to center.`,
            ],
      ].filter((pair) => pair.length);
      if (missing.length)
        issues.push(
          fail(
            `The empty state ${at} has ${new Intl.ListFormat('en-GB').format(missing.map(([wrong]) => wrong ?? ''))}. An empty state has one icon or illustration, one sentence and one action, centred. ${missing.map(([, fix]) => fix).join(' ')}`,
            at,
          ),
        );
    }
    return issues;
  },
);
