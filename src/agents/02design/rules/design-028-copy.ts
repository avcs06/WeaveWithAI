import type { Issue } from '../../../core/issues';
import { defineRule, duplicates, type Fail } from '../../../core/rules';
import type { Copy } from '../03architect/schema';
import type { ModelNode } from '../07draw/schema';
import type { FrameInput, WidgetIaInput, WidgetInput } from './helpers';

/**
 * DESIGN-028 · mandatory
 * Every visible string is in the copy deck once and is named by its id, so it
 * reads the same on every screen. Deck ids are like C001 and unique, no text
 * is in the deck twice, every id the IA names is in the deck, a widget lists
 * its title among its copy, and a navigation item's label is its page's
 * title. A widget's or frame's nodes name deck ids or the strings the call
 * adds (W03.c1, SH1.c1), never a deck string again; a widget shows every
 * string the IA gave it, and a frame's link to a navigation item's page says
 * the item's label.
 * Pass: "Add book" as one id on the shelf's header.
 * Fail: the Shelf item labelled "Shelf" while its page's title is "Your shelf".
 */
const DECK = /^C\d{3,}$/;

export const iaRule = defineRule<WidgetIaInput>(
  'DESIGN-028',
  'mandatory',
  ({ ia }, fail) => {
    const issues: Issue[] = [];
    const deck = new Map(ia.copy.map((c) => [c.id, c.text]));
    for (const id of duplicates(ia.copy, (c) => c.id))
      issues.push(
        fail(`Copy id ${id} is used twice; every string has its own id.`, id),
      );
    for (const text of duplicates(ia.copy, (c) => c.text))
      issues.push(
        fail(
          `"${text}" is in the deck twice; keep one id and name it wherever the string shows.`,
          text,
        ),
      );
    for (const c of ia.copy)
      if (!DECK.test(c.id))
        issues.push(fail(`Copy id ${c.id} is not like C001.`, c.id));
    for (const screen of ia.screens)
      if (screen.title && !deck.has(screen.title))
        issues.push(
          fail(
            `${screen.id}'s title ${screen.title} is not in the copy deck.`,
            screen.id,
          ),
        );
    for (const widget of ia.widgets) {
      const unknown = widget.copy.filter((id) => !deck.has(id));
      if (unknown.length)
        issues.push(
          fail(
            `${widget.id} shows ${unknown.join(', ')}, not in the copy deck; add them or name deck ids.`,
            widget.id,
          ),
        );
      if (widget.title && !widget.copy.includes(widget.title))
        issues.push(
          fail(
            `${widget.id}'s title ${widget.title} is not among its copy; list it.`,
            widget.id,
          ),
        );
    }
    for (const item of ia.navigation.items) {
      const title = ia.screens.find((s) => s.id === item.screen)?.title ?? '';
      if (item.label === title && deck.has(title)) continue;
      issues.push(
        fail(
          title
            ? `The navigation item to ${item.screen} is ${item.label} ("${deck.get(item.label) ?? '?'}") but the page's title is ${title} ("${deck.get(title)}"); label it with ${title} so both read the same.`
            : `The navigation item ${item.label} leads to ${item.screen}, which has no title; give the page a title and label the item with it.`,
          item.screen,
        ),
      );
    }
    return issues;
  },
);

/** Issues with the copy a call's nodes name and the strings it adds as `owner`. */
function named(
  nodes: ModelNode[],
  added: Copy[],
  owner: string,
  deck: Copy[],
  fail: Fail,
): Issue[] {
  const issues: Issue[] = [];
  const ids = new Set(deck.map((c) => c.id));
  const texts = new Map(deck.map((c) => [c.text, c.id]));
  for (const c of added) {
    if (!new RegExp(`^${owner}\\.c\\d+$`).test(c.id))
      issues.push(
        fail(
          `${c.id} is not like ${owner}.c1; a string this call adds is named after ${owner}.`,
          owner,
        ),
      );
    const same = texts.get(c.text);
    if (same)
      issues.push(
        fail(
          `${c.id} "${c.text}" is already in the deck as ${same}; name ${same} instead.`,
          owner,
        ),
      );
  }
  const own = new Set(added.map((c) => c.id));
  for (const node of nodes)
    for (const id of [node.text, node.label].filter(Boolean))
      if (!ids.has(id) && !own.has(id))
        issues.push(
          fail(
            `${node.id} names ${JSON.stringify(id)}, which is not a copy id of the deck or of ${owner}'s copy; name an id, and put a value it shows in sample.`,
            node.id,
          ),
        );
  return issues;
}

export const widgetRule = defineRule<WidgetInput>(
  'DESIGN-028',
  'mandatory',
  ({ build, widget, ia }, fail) => {
    const issues = named(build.nodes, build.copy, widget.id, ia.copy, fail);
    const shown = new Set(
      build.nodes.flatMap((node) => [node.text, node.label]),
    );
    const missing = widget.copy.filter((id) => !shown.has(id));
    if (missing.length)
      issues.push(
        fail(
          `${widget.id} must show ${missing.join(', ')}, but no node names ${missing.length === 1 ? 'it' : 'them'}.`,
          widget.id,
        ),
      );
    return issues;
  },
);

export const frameRule = defineRule<FrameInput>(
  'DESIGN-028',
  'mandatory',
  ({ frame, ia }, fail) => {
    const issues = named(frame.nodes, frame.copy, frame.screen, ia.copy, fail);
    // A wordmark may link to the same page under the app's name; one link per item says the label.
    for (const item of ia.navigation.items) {
      const links = frame.nodes.filter(
        (n) => n.role === 'navigation' && n.navigatesTo === item.screen,
      );
      if (links.length && !links.some((n) => n.text === item.label))
        issues.push(
          fail(
            `${frame.screen} links to ${item.screen} but no link names the navigation item's label ${item.label}; the link that draws the item says it.`,
            links[0]?.id,
          ),
        );
    }
    return issues;
  },
);
