/**
 * The center of the app layout's header, kept in the bar's middle whatever
 * its ends hold. Style it as the theme names it.
 *
 * Holds, as the theme names them:
 * - The navigation, when the layout has no sidebar: a `NextLink` from
 *   `@app/components/NextLink` per destination, the current one marked
 *   `aria-current="page"`.
 * - A search over the app's records, when a flow searches: `SearchInput`
 *   from `@packages/ui/Input`.
 *
 * Leaves out:
 * - The logo and the account: the ends hold them, placed by code.
 * - A wrapper, height, padding, background or border: PageLayout draws the
 *   bar.
 * - Search, help or settings with no flow behind them.
 */
export const AppHeader = () => null;
