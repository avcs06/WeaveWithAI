import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { depthFirst } from '../08assemble/nodes';
import type { CatalogInput, ScreenInput, WidgetInput } from './helpers';

/**
 * DESIGN-030 · mandatory
 * The heading plan (DS23). On a screen, an instance whose widget contains a
 * heading takes a level, 1 to 3, and no other does: a page has exactly one
 * level 1, which shows the page's title when it has one, and levels never skip
 * in reading order; a dialog or drawer has no level 1. In a widget that
 * contains a heading, its top heading comes first at level 1, the levels under
 * it never skip, and a widget without one has no heading. A widget takes its
 * level from each instance, so it no longer keeps one (user, 2026-10-31).
 * Pass: S04's header at 1 with the title "Your shelf", its list at 2.
 * Fail: a level 3 straight after the level 1.
 */
export const screenRule = defineRule<ScreenInput>(
  'DESIGN-030',
  'mandatory',
  ({ layout, screen, catalog }, fail) => {
    const issues: Issue[] = [];
    const widgets = new Map(catalog.widgets.map((w) => [w.id, w]));
    // Reading order: the box tree depth first, an instance's slots right after it.
    const ordered: typeof layout.instances = [];
    const walk = (place: string) => {
      const kids = [
        ...layout.boxes.filter((b) => b.parent === place).map((b) => ({ order: b.order, box: b.id })),
        ...layout.instances.filter((i) => i.in === place || i.in.startsWith(`${place}/`)).map((i) => ({ order: i.order, instance: i })),
      ].sort((a, b) => a.order - b.order);
      for (const kid of kids) {
        if ('box' in kid) walk(kid.box);
        else if (!ordered.includes(kid.instance)) (ordered.push(kid.instance), walk(kid.instance.id));
      }
    };
    walk('');
    // A dialog's or drawer's name is its level 1, so its headings start at 2.
    let deepest = screen.type === 'page' ? 0 : 1;
    for (const instance of ordered) {
      const contains = widgets.get(instance.places)?.containsHeading ?? false;
      const level = instance.headingLevel;
      if (!contains) {
        if (level)
          issues.push(fail(`${instance.id} has heading level ${level}, but ${instance.places} contains no heading. Give ${instance.id} heading level 0.`, instance.id));
        continue;
      }
      if (level < 1 || level > 3)
        issues.push(fail(`${instance.id} places ${instance.places}, which contains a heading. Give ${instance.id} a heading level from 1 to 3.`, instance.id));
      else if (level > deepest + 1)
        issues.push(fail(`${instance.id} has heading level ${level}, but the highest level before it in reading order is ${deepest}. A level is at most one more than the levels before it. Give ${instance.id} level ${deepest + 1} or lower.`, instance.id));
      deepest = Math.max(deepest, level);
    }
    const ones = ordered.filter((i) => i.headingLevel === 1);
    if (screen.type !== 'page') {
      for (const one of ones)
        issues.push(fail(`${one.id} has heading level 1 in the ${screen.type} ${screen.id}. A ${screen.type}'s name is its level-1 heading, so its instances start at level 2. Give ${one.id} level 2.`, one.id));
    } else if (ones.length !== 1) {
      issues.push(fail(`${screen.id} has ${ones.length} instances at heading level 1. A page has exactly one: the instance that shows the page's title. Give level 1 to that instance only.`, screen.id));
    } else if (screen.title) {
      const words = ones[0]?.slots.find((s) => s.name === 'title')?.text ?? '';
      if (words !== screen.title)
        issues.push(fail(`${ones[0]?.id} is the level-1 instance of ${screen.id}, and its title slot says "${words}". The page's title is "${screen.title}". Give the title slot exactly "${screen.title}".`, ones[0]?.id ?? screen.id));
    }
    return issues;
  },
);

export const widgetRule = defineRule<WidgetInput>(
  'DESIGN-030',
  'mandatory',
  ({ build, widget }, fail) => {
    const headings = depthFirst(build.nodes).filter((n) => n.headingLevel > 0);
    if (!widget.containsHeading)
      return headings.map((n) => fail(`${n.id} is a heading, but the definition of ${widget.id} says it contains no heading. Make ${n.id} text, with heading level 0.`, n.id));
    const issues: Issue[] = [];
    if (headings[0]?.headingLevel !== 1)
      issues.push(fail(`${widget.id} contains a heading, so its first heading in reading order is its top heading, at level 1. Each instance gives that heading its level on the screen. Give the first heading level 1.`, widget.id));
    let deepest = 0;
    for (const n of headings) {
      if (n.headingLevel > deepest + 1)
        issues.push(fail(`${n.id} has heading level ${n.headingLevel}, but the highest level before it in ${widget.id} is ${deepest}. A level is at most one more than the levels before it. Give ${n.id} level ${deepest + 1} or lower.`, n.id));
      deepest = Math.max(deepest, n.headingLevel);
    }
    return issues;
  },
);

/**
 * In the catalog: every page has a part with a heading for its level 1, and a
 * page with a title shows it there, in a `title` words slot. Untitled pages
 * were left out until the dashboard run's editor had no heading to give level
 * 1 in five screen rounds (user, 2026-10-31).
 */
export const catalogRule = defineRule<CatalogInput>(
  'DESIGN-030',
  'mandatory',
  ({ catalog, plan }, fail) =>
    plan.screens
      .filter((screen) => screen.type === 'page')
      .flatMap((screen) => {
        const parts = catalog.screens.find((s) => s.screen === screen.id)?.parts ?? [];
        const headed = catalog.widgets.filter((w) => parts.includes(w.id) && w.containsHeading);
        if (!screen.title)
          return headed.length
            ? []
            : [fail(`${screen.id} is a page, and a page has exactly one level-1 heading, but none of its widgets contains a heading. Give the widget at the top of ${screen.id} a heading that says what the page shows, such as the name of the record it opens, and set its containsHeading to true.`, screen.id)];
        const shows = headed.some((w) => w.slots.some((s) => s.name === 'title' && s.kind === 'words'));
        return shows
          ? []
          : [fail(`${screen.id} has the title "${screen.title}", but none of its widgets has both a heading and a title words slot to show it. The page's title shows in one of its widgets. Give the widget at the top of ${screen.id} a heading and a words slot named title.`, screen.id)];
      }),
);
