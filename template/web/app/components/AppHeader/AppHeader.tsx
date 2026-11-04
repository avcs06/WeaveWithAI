/**
 * The center of the app's header bar. It stays in the middle of the bar.
 *
 * Put here:
 * - The navigation, when the app has no sidebar. Use one `NextLink` from
 *   `@app/components/NextLink` with `look="plain"` per page. Mark the
 *   current page with `aria-current="page"`, from `usePathname()` of
 *   `next/navigation`. Example: Projects, Clients, Invoices.
 *   Each link opens a route from `.weave/01-scaffold/routes.json`.
 * - A search over the app's records, when a flow searches them. Use
 *   `SearchInput` from `@packages/ui/Input`. Example: "Search clients".
 *
 * PageLayout draws the bar. Return only the items: no wrapper, height,
 * padding, background or border.
 *
 * Never put here:
 * - The logo or the account. Code places them at the ends of the bar.
 * - A search, help or settings that no flow uses.
 *
 * The line "The theme puts here" below names this app's items. Build those
 * and nothing else.
 */
export const AppHeader = () => null;
