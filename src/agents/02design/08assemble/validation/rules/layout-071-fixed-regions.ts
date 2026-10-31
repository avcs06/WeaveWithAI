import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-071 · mandatory · H-71 A fixed-height region holds its content
 * A shell region the theme gives a fixed height keeps every node it holds
 * inside its padding; the solver draws the region at that height whatever
 * its nodes need, so nothing else notices a clipped bar. Its text is a
 * Truncate, one line whatever it says, so its height is exact (DS28).
 * Pass: the 56 tall app top bar, padding 12, holding 32 tall buttons.
 * Fail: the same bar holding 40 tall buttons, or a text node that can wrap.
 */
export const rule = defineRule<LayoutInput>(
  'LAYOUT-071',
  'mandatory',
  ({ screens, views }, fail) => {
    const issues: Issue[] = [];
    const fixed = screens.shells
      .flatMap((shell) => shell.regions)
      .filter((region) => region.box.height === 'fixed');
    for (const region of fixed) {
      // Every page using the shell draws the region the same; one is enough.
      const rect = views
        .map((view) => ({ view, rect: view.rect(region.id) }))
        .find(({ rect }) => rect);
      if (!rect?.rect) continue;
      const { view, rect: box } = rect;
      const top = box.y + box.padding[0];
      const bottom = box.y + box.height - box.padding[2];
      const out = view
        .kids(region.id)
        .filter((kid) => kid.y < top - 0.5 || kid.y + kid.height > bottom + 0.5);
      if (out.length)
        issues.push(
          fail(
            `${region.id} has a fixed height of ${box.height}px with layout padding ${box.padding[0]}px, which leaves ${box.height - box.padding[0] - box.padding[2]}px of height for its nodes. ${new Intl.ListFormat('en-GB').format(out.map((kid) => `${kid.id} is ${kid.height}px tall`))}, and ${out.length > 1 ? 'they reach' : 'it reaches'} outside that padding. A region of fixed height holds every node inside its padding. Make those nodes smaller, such as a smaller size of their component. Otherwise the theme sets the box heightPx of ${region.id} to at least ${Math.max(...out.map((kid) => kid.height)) + box.padding[0] + box.padding[2]}, or a smaller layout padding.`,
            region.id,
          ),
        );
      const inside = (id: string): string[] =>
        view.kids(id).flatMap((kid) => [kid.id, ...inside(kid.id)]);
      for (const id of inside(region.id)) {
        const node = view.node(id);
        if (node?.component === 'none' && node.typeScale !== 'none')
          issues.push(
            fail(
              `${id} is text that can wrap, inside ${region.id}, a region of fixed height. Text in a region of fixed height is a Truncate, so it stays on one line. Set the component of ${id} to Truncate, so it shows one line that ends in an ellipsis.`,
              id,
            ),
          );
      }
    }
    return issues;
  },
);
