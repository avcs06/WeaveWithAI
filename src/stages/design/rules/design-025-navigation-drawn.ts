import { defineRule } from '../../../core/rules';
import type { ScreensInput } from './design-helpers';

/**
 * DESIGN-025 · mandatory
 * Every navigation item is drawn: a navigation node going to the item's screen,
 * in a region of a shell used by a page of the item's access, so signed-in
 * items sit in a frame signed-in pages show.
 * Pass: Shelf in the app top bar, Sign in in the marketing top bar.
 * Fail: the Shelf node gone from the app top bar.
 */
export const rule = defineRule<ScreensInput>(
  'DESIGN-025',
  'mandatory',
  ({ screens }, fail) => {
    // Each region with the accesses of the pages whose shell holds it.
    const seenBy = new Map<string, Set<string>>();
    for (const shell of screens.shells) {
      const access = new Set(
        screens.screens
          .filter((s) => s.shell === shell.id)
          .map((s) => s.access),
      );
      for (const region of shell.regions) seenBy.set(region.id, access);
    }
    const drawn = new Set(
      screens.nodes
        .filter((node) => node.role === 'navigation')
        .flatMap((node) =>
          [...(seenBy.get(node.section) ?? [])].map(
            (access) => `${node.navigatesTo} ${access}`,
          ),
        ),
    );
    return screens.navigation.items
      .filter((item) => !drawn.has(`${item.screen} ${item.access}`))
      .map((item) =>
        fail(
          `The navigation item ${item.label} is not drawn where its users are; add a navigation node going to ${item.screen} in a region of the shell its ${item.access} pages use.`,
          item.screen,
        ),
      );
  },
);
