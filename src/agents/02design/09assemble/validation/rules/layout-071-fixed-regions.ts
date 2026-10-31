import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import type { LayoutInput } from '../helpers';

/**
 * LAYOUT-071 · mandatory · H-71 A fixed-height region holds its content
 * A shell region the theme gives a fixed height keeps every node it holds
 * inside its padding; the solver draws the region at that height whatever
 * its nodes need, so nothing else notices a clipped bar.
 * Pass: the 56 tall app top bar, padding 12, holding 32 tall buttons.
 * Fail: the same bar holding 40 tall buttons.
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
            `${region.id} is ${box.height} tall with padding ${box.padding[0]}, but ${out.map((kid) => `${kid.id} (${kid.height} tall)`).join(', ')} do not fit inside it; make the region taller, its padding smaller, or its nodes smaller.`,
            region.id,
          ),
        );
    }
    return issues;
  },
);
