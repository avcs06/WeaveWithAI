import React from 'react';

import { PageLogo } from '../PageLogo';

/**
 * The left end of the app's header bar.
 *
 * Put here, in this order:
 * - The logo. Code places `PageLogo` here when the theme puts the logo at
 *   the left. Keep it first, as it is.
 * - The navigation, when the app has no sidebar and the theme puts it here.
 *   Use one `NextLink` from `@app/components/NextLink` with `look="plain"`
 *   per page. Mark the current page with `aria-current="page"`, from
 *   `usePathname()` of `next/navigation`. Example: Projects, Clients.
 *   Each link opens a route from `.weave/01-scaffold/routes.json`.
 *
 * PageLayout draws the bar and lays these items in a row. Return only the
 * items: no wrapper, height, padding, background or border.
 *
 * Never put here:
 * - An H1, a page's title or a page's actions. They go in the page's
 *   `PageHeader`.
 *
 * The line "The theme puts here" below names this app's items. Build those
 * and nothing else.
 */
export const AppHeaderLeftSlot = () => <PageLogo />;
