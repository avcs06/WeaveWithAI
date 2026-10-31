import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { ACTIONS, type ScreensInput } from './helpers';

/**
 * DESIGN-028 · mandatory
 * Code builds the copy deck from every word shown (DS23), so the rule checks
 * what a deck cannot fix: one step is shown with one wording everywhere (not a
 * node showing a record's value, whose words differ by record, and not a
 * subflow's step, which each flow words for its own record), a
 * frame's link to a navigation item's page says the item's label, and a page
 * with a navigation item has that label as its level-1 heading. A frame's
 * wordmark is the logo, so it says the app's name wherever it links (DS45).
 * Pass: "Add book" on every control of F03.S01; the Shelf item and its H1 both "Your shelf".
 * Fail: "Add book" on the shelf and "New book" in the empty state, both serving F03.S01.
 */
export const rule = defineRule<ScreensInput>(
  'DESIGN-028',
  'mandatory',
  ({ screens, ctx }, fail) => {
    const issues: Issue[] = [];
    const shells = new Set(screens.shells.flatMap((s) => s.regions.map((r) => r.id)));
    const wordmark = (n: (typeof screens.nodes)[number]) => shells.has(n.section) && /wordmark/i.test(n.what);
    const app = ctx.scope.app.name;
    for (const node of screens.nodes.filter((n) => wordmark(n) && n.text !== app))
      issues.push(
        fail(
          `${node.id} is the wordmark, and it says "${node.text}". The wordmark is the app's logo, so it says the app's name. Give ${node.id} the text "${app}".`,
          node.id,
        ),
      );
    const subflow = new Set(
      ctx.flows.subflows.flatMap((s) => [...s.steps, ...s.alternatives].map((x) => x.id)),
    );
    const wordings = new Map<string, Set<string>>();
    for (const node of screens.nodes)
      if ((ACTIONS.has(node.role) || node.role === 'navigation') && node.text && !node.data.length)
        for (const step of node.flowSteps.filter((id) => !subflow.has(id)))
          wordings.set(step, new Set([...(wordings.get(step) ?? []), node.text]));
    for (const [step, texts] of wordings)
      if (texts.size > 1)
        issues.push(
          fail(
            `${step} is shown as ${[...texts].map((t) => `"${t}"`).join(' and ')}. One step keeps one wording on every control that serves it. Pick one of those, and give it to every control that serves ${step}.`,
            step,
          ),
        );
    for (const item of screens.navigation.items) {
      if (!item.label) continue;
      for (const node of screens.nodes.filter(
        (n) => shells.has(n.section) && !wordmark(n) && n.role === 'navigation' && n.navigatesTo === item.screen,
      ))
        if (node.text !== item.label)
          issues.push(
            fail(
              `${node.id} links to ${item.screen} with the text "${node.text}", but the navigation item for ${item.screen} says "${item.label}". A frame's link to a navigation item's page says the item's label, which is the page's title. Give ${node.id} the text "${item.label}".`,
              node.id,
            ),
          );
      const sections = new Set(
        screens.sections.filter((s) => s.screen === item.screen).map((s) => s.id),
      );
      const h1 = screens.nodes.find((n) => sections.has(n.section) && n.headingLevel === 1);
      if (h1 && h1.text !== item.label)
        issues.push(
          fail(
            `${h1.id}, the level-1 heading of ${item.screen}, says "${h1.text}", but the navigation item for ${item.screen} says "${item.label}". A page with a navigation item has the item's label, the page's title, as its level-1 heading. Give ${h1.id} the text "${item.label}".`,
            h1.id,
          ),
        );
    }
    return issues;
  },
);
