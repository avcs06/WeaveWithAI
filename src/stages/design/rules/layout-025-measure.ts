import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { CHAR_WIDTH_EM } from '../../../config/design';
import type { LayoutInput } from './layout-helpers';

/**
 * LAYOUT-025 · warning · H-25 Measure for reading
 * A line of reading text holds at most 90 characters; a wrapped paragraph holds
 * at least 45 and is never wider than 720.
 * Pass: a 560 line of 16px text, about 63 characters.
 * Fail: an 1100 line of 20px text, about 100 characters.
 */
const READING = new Set(['body', 'subheading', 'heading']);

export const rule = defineRule<LayoutInput>(
  'LAYOUT-025',
  'warning',
  ({ views, fontPx }, fail) => {
    const issues: Issue[] = [];
    for (const view of views)
      for (const rect of view.rects) {
        const node = view.node(rect.id);
        if (node?.role !== 'text' || !READING.has(node.typeScale)) continue;
        // A line holds what the width allows, or the whole text when it is shorter.
        const perLine = Math.round(
          Math.min(
            node.text.length,
            rect.width / (fontPx(node.typeScale) * CHAR_WIDTH_EM),
          ),
        );
        const wraps = rect.lines >= 2;
        const tooShort = wraps && perLine < 45;
        if (tooShort || perLine > 90 || (wraps && rect.width > 720))
          issues.push(
            fail(
              `${rect.id} runs about ${perLine} characters a line, ${Math.round(rect.width)} wide; keep paragraphs 45 to 90 characters and at most 720 wide.`,
              rect.id,
            ),
          );
      }
    return issues;
  },
);
