import type { Issue } from '../../core/issues';
import type { Run } from '../../core/run';
import { type RouteSample, runRenderedChecks, type ThemeColors } from '../../checks';
import { APP_URL, withDevServer } from '../../engine/server';
import type { Theme } from '../02design/01theme/build';

// The rendered checks of a code unit (DESIGN-R-001 to 011): axe, contrast,
// target sizes, the keyboard walk, the spacing and the rest, on its routes, after its session.

/** The brand's accent fills; accentFg is the text on them, often the page's own white. */
const ACCENT_FILLS = new Set(['accentBg', 'accentHoverBg']);

/** Every hex color of the theme, and the brand's accent fills among them. */
export function themeColors(theme: Theme): ThemeColors {
  const all = new Set<string>();
  const accent = new Set<string>();
  const walk = (value: unknown, key = '', brand = false) => {
    if (typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value)) {
      all.add(value);
      if (brand && ACCENT_FILLS.has(key)) accent.add(value);
    } else if (value && typeof value === 'object')
      for (const [k, v] of Object.entries(value)) walk(v, k, brand || k === 'theme');
  };
  walk(theme.colors);
  return { all, accent };
}

/** One route as the checks sample it; an entry page also checks its first viewport, and a page behind sign-in loads with `storage`'s session. */
export function routeSample(
  route: string,
  screen: string,
  entry: boolean,
  storage?: Record<string, string>,
): RouteSample {
  return { route, url: `${APP_URL}${route}`, screen, entry, ...(storage && { storage }) };
}

/** The checks on `routes`, with the app's dev server up for them. */
export function renderedOn(run: Run, appDir: string, routes: RouteSample[], theme: Theme): () => Promise<Issue[]> {
  return () =>
    withDevServer(appDir, async () => (await runRenderedChecks({ run, routes, theme: themeColors(theme) })).issues, routes[0]?.url);
}
