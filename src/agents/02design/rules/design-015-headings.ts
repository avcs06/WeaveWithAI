import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { type NodesInput, readingOrder } from './helpers';

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
            `${node.id} is a level-1 heading in the shell ${screen}. A shell shows beside every page. A page's title is the page's only level-1 heading. Make ${node.id} plain text with heading level 0, or give it a level from 2 to 4.`,
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
          `${screen} has ${ones} level-1 headings. A page has exactly one level-1 heading. ${ones ? 'Keep level 1 on one of them, and give the others a level from 2 to 4.' : "Give the page's main heading level 1."}`,
          screen,
        ),
      );
    let deepest = 0;
    for (const node of headings) {
      if (node.headingLevel > deepest + 1)
        issues.push(
          fail(
            `${node.id} has heading level ${node.headingLevel}, but the highest level before it in reading order is ${deepest}. A level is at most one more than the levels before it. Give ${node.id} level ${deepest + 1} or lower.`,
            node.id,
          ),
        );
      deepest = Math.max(deepest, node.headingLevel);
    }
    return issues;
  },
);
