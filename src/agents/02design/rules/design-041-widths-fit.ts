import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { CatalogInput, ComponentInput } from './helpers';

/**
 * DESIGN-041 · mandatory
 * Widths fit (DS23, DR13): a widget's minimum, added up from its coarse
 * layout, fits the content width of every screen that uses it, and each slot's
 * range fits inside its widget's. Each declared component has one width
 * range, and invent draws its root inside it.
 * Pass: a 480 list on a 960 page, with a body slot of 240 to fill.
 * Fail: a table needing 1040 on a 960 page.
 */
export const rule = defineRule<CatalogInput>(
  'DESIGN-041',
  'mandatory',
  ({ catalog, plan, widthOf }, fail) => {
    const issues: Issue[] = [];
    for (const widget of catalog.widgets) {
      for (const screen of catalog.screens.filter((s) => s.parts.includes(widget.id))) {
        const width = widthOf(screen.screen);
        if (widget.minWidthPx > width + 0.5)
          issues.push(fail(`${widget.id} needs ${widget.minWidthPx}px, but ${screen.screen} gives it ${Math.round(width)}px. A widget's minimum width, added up from its layout, fits the content width of every screen that uses it. Put fewer parts in a row of ${widget.id}, or set text wrap on its text parts.`, widget.id));
      }
      for (const slot of widget.slots)
        if ((widget.maxWidthPx && slot.minWidthPx > widget.maxWidthPx) || (slot.maxWidthPx && slot.maxWidthPx < slot.minWidthPx))
          issues.push(fail(`The ${slot.name} slot of ${widget.id} runs from ${slot.minWidthPx}px to ${slot.maxWidthPx ? `${slot.maxWidthPx}px` : 'fill'}. That does not fit inside the range of ${widget.id}, ${widget.minWidthPx}px to ${widget.maxWidthPx ? `${widget.maxWidthPx}px` : 'fill'}. A slot's range fits inside its widget's range. A slot's widest is at least its narrowest. Give the ${slot.name} slot ${widget.maxWidthPx ? `a minWidthPx of ${widget.maxWidthPx} or less, and ` : ''}a maxWidthPx of 0 or at least its minWidthPx.`, widget.id));
    }
    const declared = new Set(plan.newComponents.map((c) => c.name));
    for (const name of declared) {
      const ranges = catalog.components.filter((c) => c.name === name);
      if (ranges.length !== 1)
        issues.push(fail(`${name} has ${ranges.length} width ranges in components. Each declared new component has exactly one width range. ${ranges.length ? `Keep one entry for ${name} in components, and drop the others.` : `Add an entry for ${name} to components, with its minWidthPx and maxWidthPx.`}`, name));
    }
    for (const range of catalog.components) {
      if (!declared.has(range.name))
        issues.push(fail(`${range.name} has a width range in components, but it is not a declared new component. Only a declared new component has a width range. Drop ${range.name} from components.`, range.name));
      else if (range.maxWidthPx && range.maxWidthPx < range.minWidthPx)
        issues.push(fail(`${range.name} runs from ${range.minWidthPx}px to ${range.maxWidthPx}px, so its widest is less than its narrowest. A width range's maxWidthPx is at least its minWidthPx, or 0 to fill. Set the maxWidthPx of ${range.name} to ${range.minWidthPx} or more, or to 0.`, range.name));
    }
    return issues;
  },
);

/** Invent draws a component's root inside the width range catalog gave it. */
export const componentRule = defineRule<ComponentInput>(
  'DESIGN-041',
  'mandatory',
  ({ name, box, range }, fail) =>
    box.width === 'fixed' && (box.widthPx < range.minWidthPx || (range.maxWidthPx > 0 && box.widthPx > range.maxWidthPx))
      ? [fail(`The root of ${name} is fixed at ${box.widthPx}px, outside its width range of ${range.minWidthPx}px to ${range.maxWidthPx ? `${range.maxWidthPx}px` : 'fill'}. A component's root is drawn inside its width range. Set the widthPx of the root box ${range.maxWidthPx ? `from ${range.minWidthPx} to ${range.maxWidthPx}` : `to ${range.minWidthPx} or more`}.`, name)]
      : [],
);
