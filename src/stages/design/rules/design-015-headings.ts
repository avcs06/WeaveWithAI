import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { type NodesInput, readingOrder } from './design-helpers';

/**
 * DESIGN-015 · mandatory
 * A page has exactly one level-1 heading, and heading levels never skip; a
 * shell, shown on every page beside it, has none.
 * Pass: H1, H2, H3, H3, H3 on the landing page.
 * Fail: H1, then H3.
 */
export const rule = defineRule<NodesInput>(
  'DESIGN-015',
  'mandatory',
  ({ nodes, ia, ctx, screen }, fail) => {
    const issues: Issue[] = [];
    // A shell shows on every page beside the page's own H1.
    if (ctx.shells.some((shell) => shell.id === screen))
      return nodes
        .filter((node) => node.headingLevel === 1)
        .map((node) =>
          fail(
            `${node.id} is a level-1 heading in the shell; the page's title is its only H1, so make the shell's text a plain line or a lower level.`,
            node.id,
          ),
        );
    if (ia.screens.find((s) => s.id === screen)?.type !== 'page') return issues;
    const headings = readingOrder(ia, nodes, screen).filter(
      (node) => node.headingLevel > 0,
    );
    const ones = headings.filter((node) => node.headingLevel === 1).length;
    if (ones !== 1)
      issues.push(
        fail(
          `${screen} has ${ones} level-1 headings; a page has exactly one.`,
          screen,
        ),
      );
    let deepest = 0;
    for (const node of headings) {
      if (node.headingLevel > deepest + 1)
        issues.push(
          fail(
            `${node.id} is an H${node.headingLevel} after an H${deepest}; heading levels never skip.`,
            node.id,
          ),
        );
      deepest = Math.max(deepest, node.headingLevel);
    }
    return issues;
  },
);
