import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { type ScreensInput, screensOf } from './helpers';

/**
 * DESIGN-017 · mandatory
 * Every page is reachable from an entry page through navigation items or
 * navigatesTo, its shell's nodes included; every dialog or drawer has a parent
 * page and a node that opens it.
 * Pass: the shelf reached from the navigation, the book from its table.
 * Fail: the table no longer opens the book.
 */
export const rule = defineRule<ScreensInput>(
  'DESIGN-017',
  'mandatory',
  ({ screens }, fail) => {
    const issues: Issue[] = [];
    const byId = new Map(screens.screens.map((s) => [s.id, s]));
    const opens = new Map<string, Set<string>>();
    for (const node of screens.nodes)
      if (node.navigatesTo)
        for (const id of screensOf(screens, node))
          opens.set(id, new Set([...(opens.get(id) ?? []), node.navigatesTo]));
    const reached = new Set(
      screens.screens.filter((s) => s.entry).map((s) => s.id),
    );
    for (const item of screens.navigation.items) reached.add(item.screen);
    const queue = [...reached];
    for (let id = queue.shift(); id; id = queue.shift())
      for (const next of opens.get(id) ?? [])
        if (!reached.has(next)) (queue.push(next), reached.add(next));
    for (const screen of screens.screens) {
      if (screen.type === 'page' && !reached.has(screen.id))
        issues.push(
          fail(
            `${screen.id} cannot be reached from an entry page; add a navigation item or a node that navigates to it.`,
            screen.id,
          ),
        );
      if (screen.type === 'page') continue;
      if (byId.get(screen.parent)?.type !== 'page')
        issues.push(
          fail(
            `${screen.id} is a ${screen.type} with no parent page; set parent to the page that opens it.`,
            screen.id,
          ),
        );
      if (!screens.nodes.some((node) => node.navigatesTo === screen.id))
        issues.push(
          fail(
            `No node opens ${screen.id}; give the control that opens it navigatesTo ${screen.id}.`,
            screen.id,
          ),
        );
    }
    return issues;
  },
);
