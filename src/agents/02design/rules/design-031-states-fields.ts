import { defineRule } from '../../../core/rules';
import type { CatalogInput } from './helpers';

/**
 * DESIGN-031 · mandatory
 * Every state a screen shows, required by its steps or added by the
 * architect, is a state of one of its widgets (DS23). Required states and
 * fields come from the processing steps.
 * Pass: the shelf's states held by its table and its empty state.
 * Fail: S04 shows success, and none of its widgets has it.
 */
export const catalogRule = defineRule<CatalogInput>(
  'DESIGN-031',
  'mandatory',
  ({ catalog, plan }, fail) => {
    const widgets = new Map(catalog.widgets.map((w) => [w.id, w]));
    return plan.screens.flatMap((screen) => {
      const parts = catalog.screens.find((s) => s.screen === screen.id)?.parts ?? [];
      const shown = new Set<string>(parts.flatMap((p) => widgets.get(p)?.states ?? []));
      const missing = screen.states.filter((s) => s !== 'default' && !shown.has(s));
      return missing.length
        ? [fail(`${screen.id} shows ${missing.join(', ')}, but none of its widgets has ${missing.length === 1 ? 'that state' : 'those states'}. Every state a screen shows is a state of one of its widgets. Add ${missing.length === 1 ? 'it' : 'each'} to the states of the widget of ${screen.id} that shows it.`, screen.id)]
        : [];
    });
  },
);
