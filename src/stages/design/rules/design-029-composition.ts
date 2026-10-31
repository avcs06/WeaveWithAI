import type { Issue } from '../../../core/issues';
import { defineRule, duplicates } from '../../../core/rules';
import type { WidgetIaInput } from './design-helpers';

/**
 * DESIGN-029 · mandatory
 * Screens are composed of widgets: widget ids are like W01 and unique, every
 * placement names a screen and a widget, every widget is placed and every
 * screen holds one, a column screen places in its main area only, a
 * main-side screen has exactly one main and one side placement, and a widget
 * uses only declared new components.
 * Pass: the book page with its detail in main and its shelf panel at the side.
 * Fail: the book page with the shelf panel moved to main.
 */
const WIDGET = /^W\d{2,}$/;

export const iaRule = defineRule<WidgetIaInput>(
  'DESIGN-029',
  'mandatory',
  ({ ia }, fail) => {
    const issues: Issue[] = [];
    const widgets = new Set(ia.widgets.map((w) => w.id));
    const screens = new Set(ia.screens.map((s) => s.id));
    const declared = new Set(ia.newComponents.map((c) => c.name));
    for (const id of duplicates(ia.widgets, (w) => w.id))
      issues.push(fail(`Widget id ${id} is used twice.`, id));
    for (const widget of ia.widgets) {
      if (!WIDGET.test(widget.id))
        issues.push(fail(`Widget id ${widget.id} is not like W01.`, widget.id));
      if (!ia.placements.some((p) => p.widget === widget.id))
        issues.push(
          fail(
            `${widget.id} is placed on no screen; place it or drop it.`,
            widget.id,
          ),
        );
      const unknown = widget.newComponents.filter(
        (name) => !declared.has(name),
      );
      if (unknown.length)
        issues.push(
          fail(
            `${widget.id} uses ${unknown.join(', ')}, not declared in newComponents.`,
            widget.id,
          ),
        );
    }
    for (const p of ia.placements) {
      if (!screens.has(p.screen))
        issues.push(
          fail(`${p.id} is on ${p.screen}, which is not a screen.`, p.id),
        );
      if (!widgets.has(p.widget))
        issues.push(
          fail(`${p.id} places ${p.widget}, which is not a widget.`, p.id),
        );
    }
    for (const screen of ia.screens) {
      const own = ia.placements.filter((p) => p.screen === screen.id);
      const sides = own.filter((p) => p.area === 'side').length;
      if (!own.length)
        issues.push(
          fail(
            `${screen.id} places no widget; compose it from the widgets that show its content.`,
            screen.id,
          ),
        );
      else if (screen.arrangement === 'column' && sides)
        issues.push(
          fail(
            `${screen.id} is a column but places ${sides} widget${sides > 1 ? 's' : ''} at the side; use main-side or put ${sides > 1 ? 'them' : 'it'} in main.`,
            screen.id,
          ),
        );
      else if (
        screen.arrangement === 'main-side' &&
        (own.length !== 2 || sides !== 1)
      )
        issues.push(
          fail(
            `${screen.id} is main-side with ${own.length - sides} main and ${sides} side placements; it places exactly one of each.`,
            screen.id,
          ),
        );
    }
    return issues;
  },
);
