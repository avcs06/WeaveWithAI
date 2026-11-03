import type { Issue } from '../../../../../core/issues';
import { defineRule } from '../../../../../core/rules';
import { allowedWords, untracedItems } from '../../../trace';
import type { LayoutsInput } from '../helpers';

/**
 * THEME-013 · mandatory
 * A needed header's or sidebar's slot names only what the scope and the flows have, or what every frame has: the wordmark, the account, the navigation.
 * Pass: app.header.end "the Shelf link" with a Shelf noun; "Sign in"; "Create button" with a create flow
 * Fail: app.header.end "Help" with no help in the scope or flows; "Search" with no search flow
 */
export const rule = defineRule<LayoutsInput>('THEME-013', 'mandatory', ({ layouts, scope, flows }, fail) => {
  const allowed = allowedWords(scope, flows);
  const issues: Issue[] = [];
  for (const [kind, layout] of Object.entries(layouts)) {
    const parts: [string, { needed: boolean }, Record<string, string>][] = [
      ['header', layout.header, { start: layout.header.start, center: layout.header.center, end: layout.header.end }],
      ['sidebar', layout.sidebar, { top: layout.sidebar.top, items: layout.sidebar.items, bottom: layout.sidebar.bottom }],
    ];
    for (const [part, bar, slots] of parts) {
      if (!bar.needed) continue;
      for (const [slot, text] of Object.entries(slots))
        for (const item of untracedItems(text, allowed))
          issues.push(
            fail(
              `The ${kind} ${part} ${slot} names "${item}", which the scope and the flows do not have. Name only what a flow gives the user, or leave it out.`,
              `${kind}.${part}.${slot}`,
            ),
          );
    }
  }
  return issues;
});
