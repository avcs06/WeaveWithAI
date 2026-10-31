import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { depthFirst } from '../09assemble/nodes';
import {
  placementsOf,
  type WidgetIaInput,
  type WidgetInput,
} from './helpers';

/**
 * DESIGN-030 · mandatory
 * The IA plans each page's headings and the widgets keep the plan. A page
 * places exactly one widget at level 1, whose title is the page's; in reading
 * order a placement is at most one level below the deepest before it; every
 * placement of a widget has one level, 1 to 3, or 0 when it has no heading.
 * Inside a widget the first heading is at that level, none is above it, and
 * levels never skip.
 * Pass: the shelf's header at 1, its H1 "Your shelf" first.
 * Fail: the book page's shelf panel at 3 after the detail at 1.
 */
export const iaRule = defineRule<WidgetIaInput>(
  'DESIGN-030',
  'mandatory',
  ({ ia }, fail) => {
    const issues: Issue[] = [];
    const widgets = new Map(ia.widgets.map((w) => [w.id, w]));
    for (const widget of ia.widgets) {
      const levels = new Set(
        placementsOf(ia, widget.id).map((p) => p.headingLevel),
      );
      if (levels.size > 1)
        issues.push(
          fail(
            `${widget.id} is placed at levels ${[...levels].join(' and ')}; a widget keeps one heading level wherever it is placed, so make two widgets.`,
            widget.id,
          ),
        );
    }
    for (const p of ia.placements)
      if (p.headingLevel < 0 || p.headingLevel > 3)
        issues.push(
          fail(
            `${p.id} is at level ${p.headingLevel}; a widget's top heading is at 1 to 3, or 0 for none.`,
            p.id,
          ),
        );
    for (const screen of ia.screens.filter((s) => s.type === 'page')) {
      const own = ia.placements
        .filter((p) => p.screen === screen.id)
        .sort((a, b) => a.order - b.order);
      const ones = own.filter((p) => p.headingLevel === 1);
      if (ones.length !== 1)
        issues.push(
          fail(
            `${screen.id} places ${ones.length} widgets at level 1; a page has exactly one, the one with its title.`,
            screen.id,
          ),
        );
      const title = widgets.get(ones[0]?.widget ?? '')?.title;
      if (ones.length === 1 && screen.title && title !== screen.title)
        issues.push(
          fail(
            `${screen.id}'s title is ${screen.title} but its level-1 widget ${ones[0]?.widget} shows ${title || 'no title'}; its H1 is the page's title.`,
            screen.id,
          ),
        );
      let deepest = 0;
      for (const p of own.filter((x) => x.headingLevel > 0)) {
        if (p.headingLevel > deepest + 1)
          issues.push(
            fail(
              `${p.id} is at level ${p.headingLevel} after level ${deepest}; heading levels never skip.`,
              p.id,
            ),
          );
        deepest = Math.max(deepest, p.headingLevel);
      }
    }
    return issues;
  },
);

export const widgetRule = defineRule<WidgetInput>(
  'DESIGN-030',
  'mandatory',
  ({ build, widget, ia }, fail) => {
    const level = placementsOf(ia, widget.id)[0]?.headingLevel ?? 0;
    const headings = depthFirst(build.nodes).filter(
      (node) => node.headingLevel > 0,
    );
    const first = headings[0];
    if (!level)
      return headings.length
        ? [
            fail(
              `${widget.id} is placed with no heading but ${first?.id} is an H${first?.headingLevel}; make it plain text, or ask for a level.`,
              first?.id,
            ),
          ]
        : [];
    if (!first)
      return [
        fail(
          `${widget.id} is placed at level ${level} but has no heading; its title is an H${level}.`,
          widget.id,
        ),
      ];
    const issues: Issue[] = [];
    if (first.headingLevel !== level)
      issues.push(
        fail(
          `${first.id} is ${widget.id}'s first heading, an H${first.headingLevel}; it is the widget's top heading, an H${level}.`,
          first.id,
        ),
      );
    let deepest = level - 1;
    for (const node of headings) {
      if (node.headingLevel < level)
        issues.push(
          fail(
            `${node.id} is an H${node.headingLevel}, above ${widget.id}'s level ${level}.`,
            node.id,
          ),
        );
      else if (node.headingLevel > deepest + 1)
        issues.push(
          fail(
            `${node.id} is an H${node.headingLevel} after an H${deepest}; heading levels never skip.`,
            node.id,
          ),
        );
      deepest = Math.max(deepest, node.headingLevel);
    }
    return issues;
  },
);
