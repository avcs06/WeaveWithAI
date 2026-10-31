import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-031 · mandatory · H-31 Heading sizes descend
 * A deeper heading is smaller than the ones above it, and the text right under a
 * heading is one or two type steps below it.
 * Pass: display, then title, then subheading; a title over a subheading line.
 * Fail: an H2 as large as the H1.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-031',
  'mandatory',
  ({ screens, rank }, fail) => {
    const issues: Issue[] = [];
    for (const screen of screens.screens) {
      const sections = new Set(
        screens.sections.filter((s) => s.screen === screen.id).map((s) => s.id),
      );
      const nodes = screens.nodes.filter((node) => sections.has(node.section));
      const headings = nodes.filter(
        (node) => node.role === 'heading' && node.headingLevel > 0,
      );
      for (const deeper of headings) {
        const larger = headings.find(
          (h) =>
            h.headingLevel < deeper.headingLevel &&
            rank(h.typeScale) >= rank(deeper.typeScale),
        );
        if (larger)
          issues.push(
            fail(
              `${deeper.id} (H${deeper.headingLevel}, ${deeper.typeScale}) is not smaller than ${larger.id} (H${larger.headingLevel}, ${larger.typeScale}); deeper headings take smaller sizes.`,
              deeper.id,
            ),
          );
      }
      for (const heading of headings) {
        const next = nodes
          .filter(
            (node) =>
              node.section === heading.section &&
              node.parent === heading.parent &&
              node.order > heading.order,
          )
          .sort((a, b) => a.order - b.order)[0];
        if (next?.role !== 'text') continue;
        const steps = rank(next.typeScale) - rank(heading.typeScale);
        if (steps < 1 || steps > 2)
          issues.push(
            fail(
              `${next.id} (${next.typeScale}) sits ${steps} type steps below its heading ${heading.id} (${heading.typeScale}); the text a heading heads is one or two steps smaller.`,
              next.id,
            ),
          );
      }
    }
    return issues;
  },
);
