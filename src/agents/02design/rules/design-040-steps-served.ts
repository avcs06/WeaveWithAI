import { defineRule } from '../../../core/rules';
import type { CatalogInput } from './helpers';

/**
 * DESIGN-040 · mandatory
 * Every step and alternative a screen serves is served by one of the widgets
 * or components the catalog lists for it, or given to its frame (DS23, DR26).
 * Only a framed page has a frame, and its frame serves only its own steps.
 * Pass: F03.S01 on S04's header widget; F04.S01, signing out, given to S04's frame.
 * Fail: F05.S02 on S04 and on none of its widgets.
 */
export const rule = defineRule<CatalogInput>(
  'DESIGN-040',
  'mandatory',
  ({ catalog, plan }, fail) => {
    const widgets = new Map(catalog.widgets.map((w) => [w.id, w]));
    return plan.screens.flatMap((screen) => {
      const entry = catalog.screens.find((s) => s.screen === screen.id);
      const served = new Set([
        ...(entry?.parts ?? []).flatMap((p) => widgets.get(p)?.flowSteps ?? []),
        ...(entry?.frameSteps ?? []),
      ]);
      const missing = screen.flowSteps.filter((id) => !served.has(id));
      const framed = screen.type === 'page' && screen.framed;
      const stray = (entry?.frameSteps ?? []).filter((id) => !screen.flowSteps.includes(id));
      return [
        ...(missing.length
          ? [fail(`${screen.id} serves ${missing.join(', ')}, but none of its widgets serves ${missing.length === 1 ? 'it' : 'them'}, and its frame does not either. Every step and alternative a screen serves is served by one of its widgets or by its frame. Add each to the flowSteps of the widget of ${screen.id} that handles it.`, screen.id)]
          : []),
        ...(entry?.frameSteps.length && !framed
          ? [fail(`${screen.id} gives its frame ${(entry?.frameSteps ?? []).join(', ')}, but ${screen.id} is not a framed page. Only a framed page has a frame. Move those steps to the flowSteps of its widgets, and set the frameSteps of ${screen.id} to [].`, screen.id)]
          : []),
        ...(stray.length && framed
          ? [fail(`${screen.id} gives its frame ${stray.join(', ')}, which ${screen.id} does not serve. A frame serves only steps its screen serves. Remove ${stray.join(', ')} from the frameSteps of ${screen.id}.`, screen.id)]
          : []),
      ];
    });
  },
);
