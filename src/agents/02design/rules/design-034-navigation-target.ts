import { defineRule } from '../../../core/rules';
import type { NodesInput } from './helpers';

/**
 * DESIGN-034 · mandatory
 * A navigation node goes somewhere: it navigates to a screen, unless its
 * component changes the view in place (tabs, pagination, a disclosure).
 * Pass: Return to shelf going to S04; the shelf's Pagination with no target.
 * Fail: Return to shelf with no target.
 */
const IN_PLACE = new Set([
  'Tab',
  'Tabs',
  'Pagination',
  'Accordion',
  'Collapsible',
]);

export const rule = defineRule<NodesInput>(
  'DESIGN-034',
  'mandatory',
  ({ nodes }, fail) =>
    nodes
      .filter(
        (node) =>
          node.role === 'navigation' &&
          !node.navigatesTo &&
          !IN_PLACE.has(node.component),
      )
      .map((node) =>
        fail(
          `${node.id} is navigation with no target; set navigatesTo to the screen it opens, or make it the action it is.`,
          node.id,
        ),
      ),
);
