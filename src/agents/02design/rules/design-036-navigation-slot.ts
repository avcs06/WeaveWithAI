import { defineRule } from '../../../core/rules';
import type { PlanInput } from './helpers';

/**
 * DESIGN-036 · mandatory
 * Every navigation item names the slot of the layout whose frame draws it: a
 * part the layout needs and a slot the theme put something in.
 * The app frame draws a signed-in page's item; the marketing frame draws a
 * public page's item when the app has a framed marketing page, the app frame
 * otherwise, as the frame call does.
 * Pass: the Shelf item in header.end of an app layout whose header end holds the main navigation.
 * Fail: the item in sidebar.top when the app layout has no sidebar.
 */
const SLOTS: Record<string, string[]> = {
  header: ['start', 'center', 'end'],
  footer: ['start', 'center', 'end'],
  sidebar: ['top', 'bottom'],
  extraSidebar: ['top', 'bottom'],
};

export const rule = defineRule<PlanInput>(
  'DESIGN-036',
  'mandatory',
  ({ plan, layouts }, fail) => {
    const marketing = plan.screens.some((s) => s.type === 'page' && s.framed && s.kind === 'marketing');
    return plan.navigation.flatMap((item) => {
      if (!plan.screens.some((s) => s.id === item.screen))
        return [fail(`A navigation item opens ${item.screen}, which is not a screen. A navigation item opens one of the planned screens. Set the screen of this item to a screen id, or drop the item.`, item.screen)];
      const kind = item.access === 'public' && marketing ? 'marketing' : 'app';
      const [part = '', slot = ''] = item.slot.split('.');
      const layout = layouts[kind] as unknown as Record<string, Record<string, unknown>>;
      const holds = SLOTS[part]?.includes(slot) ? layout[part]?.[slot] : undefined;
      if (typeof holds === 'string' && holds && layout[part]?.needed) return [];
      const fills = Object.entries(SLOTS).flatMap(([p, names]) =>
        layout[p]?.needed ? names.filter((s) => typeof layout[p]?.[s] === 'string' && layout[p]?.[s]).map((s) => `${p}.${s}`) : [],
      );
      return [
        fail(
          `The navigation item to ${item.screen} sits in ${item.slot}, which the ${kind} layout does not fill. The ${kind} layout draws this item. An item sits in a slot that its layout fills: a part the layout needs, and a slot the theme put something in. ${fills.length ? `Set the slot of this item to one of ${fills.join(', ')}.` : `The ${kind} layout fills no slot.`}`,
          item.screen,
        ),
      ];
    });
  },
);
