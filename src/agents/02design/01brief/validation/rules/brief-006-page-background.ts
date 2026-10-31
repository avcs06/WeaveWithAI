import { defineRule } from '../../../../../core/rules';
import { readBackground } from '../../../background';
import type { BriefInput } from '../helpers';

/**
 * BRIEF-006 · mandatory
 * The page background is one CSS background value made of colors and
 * gradients (DS35, user 2026-10-31): every color in it parses, and it loads
 * no image, since the app ships no image files for it.
 * Pass: linear-gradient(180deg, #FBF7F2 0%, #F2EADF 100%).
 * Fail: url(paper.png).
 */
export const rule = defineRule<BriefInput>(
  'BRIEF-006',
  'mandatory',
  ({ brief }, fail) =>
    readBackground(brief.pageBackground).problems.map((problem) =>
      fail(
        `pageBackground is "${brief.pageBackground}", and ${problem}. Write one CSS background value made of colors and gradients only, such as "linear-gradient(180deg, #FBF7F2 0%, #F2EADF 100%)" or "#FBF7F2".`,
        'pageBackground',
      ),
    ),
);
