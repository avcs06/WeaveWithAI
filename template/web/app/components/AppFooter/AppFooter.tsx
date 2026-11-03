/**
 * The app layout's footer items, under every app page. PageLayout renders the
 * bar: its height, padding, background and separation. It lays these items
 * in a row with the theme's gap. Most apps leave the footer out.
 *
 * Holds, as the theme names them:
 * - A line of small print, such as the version or the copyright: a
 *   `Paragraph` from `@packages/ui/Typography` with `color="muted"`.
 * - Links to help or terms a flow has: `NextLink` from
 *   `@app/components/NextLink`, or `Link` from `@packages/ui/Link` for
 *   another site.
 *
 * Leaves out:
 * - A `footer` element, height, padding, background or border: PageLayout
 *   draws the bar.
 * - The navigation, the account and the main action: the header or the
 *   sidebar holds them.
 */
export const AppFooter = () => null;
