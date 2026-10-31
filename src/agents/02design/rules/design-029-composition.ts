import type { Issue } from '../../../core/issues';
import { defineRule, duplicates } from '../../../core/rules';
import type { CatalogInput, ScreenInput } from './helpers';

/**
 * DESIGN-029 · mandatory
 * Composition (DS23). In the catalog: widget ids like W01, unique; each
 * planned screen lists the widgets and declared components it is made of;
 * every widget is a part of a screen, and every declared component is a part
 * of a screen or held inside a widget. On a screen: every part is placed by an
 * instance, every instance places a part of the screen, and sits in a box of
 * the screen or in a parts slot of an instance there.
 * Pass: S04 made of W01, W03 and W07, each placed once.
 * Fail: W07 listed for S04 but placed by no instance.
 */
const WIDGET = /^W\d{2,}$/;

export const catalogRule = defineRule<CatalogInput>(
  'DESIGN-029',
  'mandatory',
  ({ catalog, plan }, fail) => {
    const issues: Issue[] = [];
    const widgets = new Set(catalog.widgets.map((w) => w.id));
    const declared = new Set(plan.newComponents.map((c) => c.name));
    const parts = new Set(catalog.screens.flatMap((s) => s.parts));
    for (const id of duplicates(catalog.widgets, (w) => w.id))
      issues.push(fail(`The widget id ${id} is used more than once. Every widget id is unique. Keep ${id} on one widget, and give the others new ids.`, id));
    for (const widget of catalog.widgets) {
      if (!WIDGET.test(widget.id))
        issues.push(fail(`The widget id "${widget.id}" is not in the form W01. A widget id is W and two or more digits. Rename ${widget.id} in that form, and use the new id wherever ${widget.id} is named.`, widget.id));
      if (!parts.has(widget.id))
        issues.push(fail(`${widget.id} is in the parts of no screen. Every widget is a part of at least one screen. Add ${widget.id} to the parts of each screen that shows it, or drop ${widget.id}.`, widget.id));
      const unknown = widget.newComponents.filter((n) => !declared.has(n));
      if (unknown.length)
        issues.push(fail(`${widget.id} holds ${unknown.join(', ')} in its newComponents, but the plan declares no new component by ${unknown.length === 1 ? 'that name' : 'those names'}. A widget holds only declared new components. The declared ones are ${[...declared].join(', ') || 'none'}. Remove ${unknown.join(', ')} from the newComponents of ${widget.id}, or use a declared one.`, widget.id));
    }
    const held = new Set(catalog.widgets.flatMap((w) => w.newComponents));
    for (const name of declared)
      if (!parts.has(name) && !held.has(name))
        issues.push(fail(`The new component ${name} is declared, but no screen has it in its parts and no widget holds it. Every declared new component is a part of a screen or held in a widget. Add ${name} to the parts of the screen that shows it, or to the newComponents of the widget that holds it.`, name));
    for (const screen of plan.screens) {
      const entry = catalog.screens.find((s) => s.screen === screen.id);
      if (!entry?.parts.length) {
        issues.push(fail(`${screen.id} has no parts. Every planned screen lists the widgets and new components it is made of. List them in the parts of ${screen.id}.`, screen.id));
        continue;
      }
      const unknown = entry.parts.filter((p) => !widgets.has(p) && !declared.has(p));
      if (unknown.length)
        issues.push(fail(`The parts of ${screen.id} include ${unknown.join(', ')}, which ${unknown.length === 1 ? 'is neither a widget nor a declared new component' : 'are neither widgets nor declared new components'}. A screen's parts are widget ids and names of declared new components. Change each of those to the widget id or new component it means, or drop it.`, screen.id));
    }
    return issues;
  },
);

export const screenRule = defineRule<ScreenInput>(
  'DESIGN-029',
  'mandatory',
  ({ layout, catalog }, fail) => {
    const issues: Issue[] = [];
    const parts = catalog.screens.find((s) => s.screen === layout.screen)?.parts ?? [];
    const boxes = new Set(layout.boxes.map((b) => b.id));
    const widgets = new Map(catalog.widgets.map((w) => [w.id, w]));
    for (const part of parts)
      if (!layout.instances.some((i) => i.places === part))
        issues.push(fail(`${part} is a part of ${layout.screen}, but no instance places it. Every part of a screen is placed by an instance. Add an instance to ${layout.screen} with places ${part}.`, part));
    for (const box of layout.boxes)
      if (box.parent && !boxes.has(box.parent))
        issues.push(fail(`${box.id} has parent ${box.parent}, which is not a box of ${layout.screen}. A box sits at the top or in another box of its screen. Set the parent of ${box.id} to a box of ${layout.screen}, or to "" for the top.`, box.id));
    for (const instance of layout.instances) {
      if (!parts.includes(instance.places))
        issues.push(fail(`${instance.id} places ${instance.places}, which is not a part of ${layout.screen}. An instance places only a part of its screen. The parts of ${layout.screen} are ${parts.join(', ') || 'none'}. Set places of ${instance.id} to one of those, or drop ${instance.id}.`, instance.id));
      if (instance.in === '' || boxes.has(instance.in)) continue;
      const [owner, slot] = instance.in.split('/');
      const host = layout.instances.find((i) => i.id === owner);
      const defined = widgets.get(host?.places ?? '')?.slots.find((s) => s.name === slot);
      if (!host || defined?.kind !== 'parts')
        issues.push(fail(`${instance.id} sits in ${instance.in}, which is neither a box of ${layout.screen} nor a parts slot of an instance there. An instance sits at the top, in a box of its screen, or in a parts slot of another instance. Set in of ${instance.id} to "" for the top, a box id such as ${layout.screen}.b1, or an instance id and a parts slot such as ${layout.screen}.p2/body.`, instance.id));
    }
    return issues;
  },
);
