import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { ACTIONS, type LayoutInput, sentences } from '../helpers';

/**
 * LAYOUT-035 · mandatory · H-35 Empty states are composed
 * An empty-state section has one icon or illustration, one sentence and one action, centred.
 * Pass: a book icon, "Your shelf is empty. ...", an Add a book button, align center.
 * Fail: the same without the icon.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-035',
  'mandatory',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    for (const section of screens.sections) {
      if (section.kind !== 'empty-state') continue;
      const nodes = screens.nodes.filter((node) => node.section === section.id);
      const media = nodes.filter((node) => node.role === 'media').length;
      const texts = nodes.filter((node) => node.role === 'text');
      const actions = nodes.filter(
        (node) => ACTIONS.has(node.role) || node.role === 'navigation',
      ).length;
      const missing = [
        media === 1 ? '' : `one icon or illustration (has ${media})`,
        texts.length === 1 && sentences(texts[0]?.text ?? '') === 1
          ? ''
          : 'one sentence',
        actions === 1 ? '' : `one action (has ${actions})`,
        section.layout.align === 'center' ? '' : 'centred content',
      ].filter(Boolean);
      if (missing.length)
        issues.push(
          fail(
            `The empty state ${section.id} needs ${missing.join(', ')}.`,
            section.id,
          ),
        );
    }
    return issues;
  },
);
