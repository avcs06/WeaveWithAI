/**
 * The footer's items. PageLayout renders the bar: its height, padding,
 * background and separation, under the page. It lays these items in a row
 * with the theme's gap. The starter's footer is empty.
 *
 * Holds, as the layout's footer names them:
 * - Links to the app's own pages, such as About or Contact: a `NextLink`
 *   from `@app/components/NextLink` each.
 * - Links to other sites or an email: `Link` from `@packages/ui/Link`.
 * - A line of small print, such as the copyright: a `Paragraph` from
 *   `@packages/ui/Typography` with `color="muted"`.
 * - `<div className="flex-1" />` before the items that sit at the end.
 *
 * Leaves out:
 * - A `footer` element, height, padding, background or border: PageLayout
 *   draws the bar.
 * - The navigation, the account and the main action: the header or the
 *   sidebar holds them.
 * - Pages, policies or social links the scope and the flows don't have.
 */
export const LayoutFooter = () => null;
