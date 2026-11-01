import { defineRule } from '../../../core/rules';
import type { CatalogInput } from './helpers';

/**
 * DESIGN-046 · mandatory
 * A widget used on several screens serves only steps every one of them serves.
 * A node serves the same steps wherever code places
 * its widget: words that differ stay words slots, and a part that differs,
 * such as a header's add button, is a small widget per screen in a parts slot.
 * Pass: one page header on five pages, each page's add button in its actions slot.
 * Fail: that header serving the add step of each of its pages.
 */
export const rule = defineRule<CatalogInput>(
  'DESIGN-046',
  'mandatory',
  ({ catalog, plan }, fail) =>
    catalog.widgets.flatMap((widget) => {
      const on = catalog.screens.filter((s) => s.parts.includes(widget.id)).map((s) => s.screen);
      if (on.length < 2) return [];
      const steps = (id: string) => plan.screens.find((s) => s.id === id)?.flowSteps ?? [];
      const apart = widget.flowSteps.filter((step) => on.some((id) => !steps(id).includes(step)));
      return apart.length
        ? [fail(`${widget.id} is on ${on.join(', ')}, and it serves ${apart.join(', ')}, which not every one of those screens serves. A widget on several screens serves only steps that every one of them serves. Give ${widget.id} a parts slot, and on each screen put a small widget in it for that screen's steps, or define ${widget.id} separately for each screen.`, widget.id)]
        : [];
    }),
);
