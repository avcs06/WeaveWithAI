import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { SHELL_IDS } from '../02theme/shells';
import type { IaInput } from './helpers';

/**
 * DESIGN-023 · mandatory
 * Only pages are framed, and a framed page's layout has a frame to put it in;
 * a dialog or drawer is not framed, and gives its own gap and padding, which
 * a page takes from its layout.
 * Pass: the shelf framed, the add-book dialog not, with padding 0 and gap 5.
 * Fail: the add-book dialog framed.
 */
export const rule = defineRule<IaInput>(
  'DESIGN-023',
  'mandatory',
  ({ ia, ctx }, fail) => {
    const issues: Issue[] = [];
    const frames = new Set(ctx.shells.map((shell) => shell.id));
    for (const screen of ia.screens) {
      if (screen.type === 'page') {
        if (screen.framed && !frames.has(SHELL_IDS[screen.kind]))
          issues.push(
            fail(
              `${screen.id} is framed, but the ${screen.kind} layout has no header, sidebar or footer; the theme gives that layout a frame, or the page sets framed false.`,
              screen.id,
            ),
          );
        continue;
      }
      if (screen.framed)
        issues.push(
          fail(
            `${screen.id} is a ${screen.type} with framed true; only pages sit in a layout, so set it to false.`,
            screen.id,
          ),
        );
      if (screen.layout.gap === '' || screen.layout.padding === '')
        issues.push(
          fail(
            `${screen.id} is a ${screen.type} with no gap or padding; a dialog or drawer gives its own spacing keys.`,
            screen.id,
          ),
        );
    }
    return issues;
  },
);
