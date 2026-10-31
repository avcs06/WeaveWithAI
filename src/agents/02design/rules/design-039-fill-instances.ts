import { defineRule } from '../../../core/rules';
import type { ScreenInput } from './helpers';

/**
 * DESIGN-039 · warning
 * An instance set to fill its height on a page: a page scrolls, so its height
 * is not bounded and fill means nothing there (DS23, DR14). Every combination
 * is valid; this one is worth a look.
 * Pass: a free list on a page; a fill editor in a dialog.
 * Fail: a fill list on a page.
 */
export const rule = defineRule<ScreenInput>(
  'DESIGN-039',
  'warning',
  ({ layout, screen }, fail) =>
    screen.type !== 'page'
      ? []
      : layout.instances
          .filter((i) => i.height === 'fill')
          .map((i) => fail(`${i.id} has height fill on the page ${screen.id}. A page scrolls, so its height has no bound and fill means nothing there. Set height free on ${i.id}, which sizes it to its content.`, i.id)),
);
