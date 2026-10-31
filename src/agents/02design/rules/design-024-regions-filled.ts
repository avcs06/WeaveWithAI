import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { ScreensInput } from './helpers';

/**
 * DESIGN-024 · mandatory
 * Every region of a shell that a page uses holds at least one node.
 * Pass: the app top bar with the wordmark, Shelf and Sign out.
 * Fail: the app top bar with no nodes.
 */
export const rule = defineRule<ScreensInput>(
  'DESIGN-024',
  'mandatory',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    const used = new Set(screens.screens.map((s) => s.shell));
    const filled = new Set(screens.nodes.map((node) => node.section));
    for (const shell of screens.shells.filter((s) => used.has(s.id)))
      for (const region of shell.regions)
        if (!filled.has(region.id))
          issues.push(
            fail(
              `${region.id} holds no nodes; fill it with what it holds (${region.holds}) or drop it.`,
              region.id,
            ),
          );
    return issues;
  },
);
