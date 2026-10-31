import { defineRule } from '../../../core/rules';
import type { ScreenInput } from './helpers';

/**
 * DESIGN-038 · mandatory
 * Each instance fills what it places (DS23): words for every words slot of its
 * widget and for no other slot; a fixed width inside the width range of what
 * it places; and in a slot, a minimum no wider than the slot's widest.
 * Pass: the shelf header with its title; a 280 side panel of 240 to 360.
 * Fail: the header without its title, or a 640 table in a 320 slot.
 */
export const rule = defineRule<ScreenInput>(
  'DESIGN-038',
  'mandatory',
  ({ layout, catalog }, fail) => {
    const widgets = new Map(catalog.widgets.map((w) => [w.id, w]));
    const rangeOf = (places: string) =>
      widgets.get(places) ?? catalog.components.find((c) => c.name === places);
    return layout.instances.flatMap((instance) => {
      const issues = [];
      const widget = widgets.get(instance.places);
      const words = new Set((widget?.slots ?? []).filter((s) => s.kind === 'words').map((s) => s.name));
      for (const name of words)
        if (!instance.slots.some((s) => s.name === name && s.text))
          issues.push(fail(`${instance.id} gives no words for the ${name} slot of ${instance.places}. An instance gives words for every words slot of its widget. Add a slot named ${name} to the slots of ${instance.id}, with the words it shows.`, instance.id));
      for (const slot of instance.slots)
        if (!words.has(slot.name))
          issues.push(fail(`${instance.id} gives words for ${slot.name}, which is not a words slot of ${instance.places}. An instance gives words only for the words slots of its widget: ${[...words].join(', ') || 'none'}. Remove ${slot.name} from the slots of ${instance.id}.`, instance.id));
      const range = rangeOf(instance.places);
      if (range && instance.size === 'fixed' && (instance.widthPx < range.minWidthPx || (range.maxWidthPx && instance.widthPx > range.maxWidthPx)))
        issues.push(fail(`${instance.id} is fixed at ${instance.widthPx}px, outside the width range of ${instance.places}, ${range.minWidthPx}px to ${range.maxWidthPx ? `${range.maxWidthPx}px` : 'fill'}. A fixed width is inside the width range of what the instance places. Set widthPx of ${instance.id} ${range.maxWidthPx ? `from ${range.minWidthPx} to ${range.maxWidthPx}` : `to ${range.minWidthPx} or more`}.`, instance.id));
      const [owner, name] = instance.in.split('/');
      if (!name) return issues;
      const host = layout.instances.find((i) => i.id === owner);
      const slot = widgets.get(host?.places ?? '')?.slots.find((s) => s.name === name);
      const min = instance.size === 'fixed' ? instance.widthPx : (range?.minWidthPx ?? 0);
      if (slot?.maxWidthPx && min > slot.maxWidthPx)
        issues.push(fail(`${instance.id} needs at least ${min}px, but the ${name} slot of ${owner} is at most ${slot.maxWidthPx}px wide. What sits in a slot has a minimum width no wider than the slot's widest. ${instance.size === 'fixed' ? `Set widthPx of ${instance.id} to ${slot.maxWidthPx} or less, or move it out of ${instance.in}.` : `Move ${instance.id} out of ${instance.in}, or place something narrower there.`}`, instance.id));
      return issues;
    });
  },
);
