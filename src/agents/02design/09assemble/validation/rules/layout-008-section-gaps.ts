import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { SECTION_GAP_PX } from '../../../config';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-008 · mandatory · H-08 Sections neither touch nor float apart
 * Between sections of a page: 24 to 32 on app screens, 24 to 48 on marketing pages.
 * Pass: 24 between the sections of a list page.
 * Fail: 16 between them.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-008',
  'mandatory',
  ({ views }, fail) => {
    const issues: Issue[] = [];
    for (const view of views) {
      if (view.screen.type !== 'page') continue;
      const [low, high] = SECTION_GAP_PX[view.screen.kind];
      for (const section of view.kids(`${view.screen.id}.content`)) {
        const gap = section.gapBefore;
        if (gap !== null && (gap < low || gap > high))
          issues.push(
            fail(
              `${section.id} is ${gap} from the section before it; keep sections ${low} to ${high} apart here.`,
              section.id,
            ),
          );
      }
    }
    return issues;
  },
);
