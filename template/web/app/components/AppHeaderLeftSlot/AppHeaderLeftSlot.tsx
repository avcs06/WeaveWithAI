import React from 'react';

import { PageLogo } from '../PageLogo';

/**
 * The left end of the app layout's header. PageLayout renders the bar and
 * keeps this slot at its left end. It lays these items in a row with the
 * theme's gap.
 *
 * Holds, as the theme names them:
 * - Code places `PageLogo` here when the theme puts the logo at the header's
 *   left. Keep it first, as it is.
 * - The navigation, when the layout has no sidebar and the theme names it
 *   here: a `NextLink` from `@app/components/NextLink` per destination, the
 *   current one marked `aria-current="page"`.
 *
 * Leaves out:
 * - A wrapper, height, padding, background or border: PageLayout draws the
 *   bar.
 * - An H1, a page's title or its actions: they go in the page's `PageHeader`
 *   from `@app/components/PageHeader`.
 */
export const AppHeaderLeftSlot = () => <PageLogo />;
