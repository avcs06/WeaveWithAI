/**
 * NotFound: a record's page when its id finds nothing. A title naming what
 * is missing as the page's H1, one line on why, and the way back to the
 * list, the same on every record's page.
 *
 * When not to use:
 * - An empty list: the list's own empty state, with the action that fills it.
 * - A route the app doesn't have: Next's own not-found page.
 *
 * Pitfalls:
 * - It replaces the whole page, PageHeader included: return it alone.
 * - Name the record by its noun in the title, "Order not found", never "Not
 *   found" alone.
 */
import { NotFound } from '@app/components/NotFound';
import React from 'react';

// Usage: the patterns to copy.
/** The page of an order whose id matches none. */
const MissingOrder = () => (
  <NotFound
    title="Order not found"
    description="It may have been deleted, or the link is wrong."
    back={{ label: 'Back to orders', href: '/orders' }}
  />
);

export default function NotFoundRecipe() {
  return <MissingOrder />;
}
