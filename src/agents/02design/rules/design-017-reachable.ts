import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { type PlanInput, type ScreensInput, screensOf } from './helpers';

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
            `${screen.id} cannot be reached from an entry page. Every page is reachable from an entry page through navigation items and nodes that navigate. Add a navigation item for ${screen.id}, or set navigatesTo ${screen.id} on a node of a page that can be reached.`,
            screen.id,
          ),
        );
      if (screen.type === 'page') continue;
      if (byId.get(screen.parent)?.type !== 'page')
        issues.push(
          fail(
            `${screen.id} is a ${screen.type} whose parent ${screen.parent || '""'} is not a page. Every dialog or drawer has a parent page. Set the parent of ${screen.id} to the page that opens it.`,
            screen.id,
          ),
        );
      if (!screens.nodes.some((node) => node.navigatesTo === screen.id))
        issues.push(
          fail(
            `No node opens ${screen.id}. Every dialog or drawer has a node that opens it. Set navigatesTo ${screen.id} on the control that opens it.`,
            screen.id,
          ),
        );
    }
    return issues;
  },
);

/** At the architect, before any control exists: an entry page to start from, and every dialog or drawer opened from a page. */
export const planRule = defineRule<PlanInput>(
  'DESIGN-017',
  'mandatory',
  ({ plan }, fail) => {
    const issues: Issue[] = [];
    const pages = new Set(plan.screens.filter((s) => s.type === 'page').map((s) => s.id));
    if (!plan.screens.some((s) => s.type === 'page' && s.entry))
      issues.push(fail('No page is an entry page. At least one page is an entry page, a page a user can start from. Set entry true on the landing page, home or sign in.', 'screens'));
    for (const s of plan.screens)
      if (s.type !== 'page' && !pages.has(s.parent))
        issues.push(fail(`${s.id} is a ${s.type} whose parent ${s.parent || '""'} is not a page. Every dialog or drawer has a parent page. Set the parent of ${s.id} to the page that opens it.`, s.id));
    return issues;
  },
);
