import type { Page } from 'playwright-core';
import { inPage } from './page';
import { type Finding, finding } from './types';

// The layout checks (DESIGN-R-013 to 016): every screen's title alike, the
// page's blocks on the container's edge, a label beside its value, and grid
// rows without a lone last item.

/** A page's H1 and the styles every screen's title shares; `pageHeader` when it is PageHeader's. */
export type PageTitle = { element: string; pageHeader: boolean; style: Record<string, string> };

/** R-013's measure on one route; null when the H1 is the landing page's hero or there is none. */
export const pageTitle = (page: Page) => inPage<PageTitle | null>(page, 'pageTitle');

const mostCommon = (styles: Record<string, string>[]) => {
  const counts = new Map<string, number>();
  for (const style of styles) counts.set(JSON.stringify(style), (counts.get(JSON.stringify(style)) ?? 0) + 1);
  const [top] = [...counts].sort((a, b) => b[1] - a[1]);
  return top ? (JSON.parse(top[0]) as Record<string, string>) : undefined;
};

/** R-013: each route whose H1 looks unlike PageHeader's title, or unlike most routes' when none has a PageHeader. Pure. */
export function titleStyles(titles: { route: string; title: PageTitle | null }[]): { route: string; finding: Finding }[] {
  const measured = titles.flatMap(({ route, title }) => (title ? [{ route, title }] : []));
  const reference =
    measured.find(({ title }) => title.pageHeader)?.title.style ?? mostCommon(measured.map(({ title }) => title.style));
  if (!reference) return [];
  return measured.flatMap(({ route, title }) => {
    const differs = Object.keys(reference).filter((key) => title.style[key] !== reference[key]);
    if (!differs.length) return [];
    const list = (style: Record<string, string>) => differs.map((key) => `${key} ${style[key]}`).join(', ');
    return [{
      route,
      finding: finding(
        'DESIGN-R-013',
        'mandatory',
        `the H1 has ${list(title.style)}; every screen's title has ${list(reference)}. Start the page with PageHeader from @app/components/PageHeader, whose title is the page's H1`,
        title.element,
      ),
    }];
  });
}

/** R-014: a block of the page whose left edge is off the frame container's content edge. */
export async function contentEdge(page: Page): Promise<Finding[]> {
  const blocks = await inPage<{ element: string; offset: number }[]>(page, 'contentEdge');
  return blocks.map((block) =>
    finding(
      'DESIGN-R-014',
      'mandatory',
      `starts ${Math.abs(block.offset)}px ${block.offset > 0 ? 'right' : 'left'} of the page container's content edge. The frame's container sets the page's padding and width: remove the padding, margin or max width this block or its wrapper adds`,
      block.element,
    ),
  );
}

/** R-015: two texts of a wide row, such as a label and its value, at its far ends. */
export async function spreadPairs(page: Page): Promise<Finding[]> {
  const pairs = await inPage<{ element: string; first: string; second: string; gap: number; width: number }[]>(page, 'spreadPairs');
  return pairs.map((pair) =>
    finding(
      'DESIGN-R-015',
      'mandatory',
      `"${pair.first}" and "${pair.second}" sit ${pair.gap}px apart in a ${pair.width}px row. Keep a label beside its value: a DescriptionList from @packages/ui/Typography, or the row at the width its content needs`,
      pair.element,
    ),
  );
}

/** R-016: a grid of three or more columns whose last row holds a single item. */
export async function gridOrphans(page: Page): Promise<Finding[]> {
  const grids = await inPage<{ element: string; columns: number; items: number }[]>(page, 'gridOrphans');
  return grids.map((grid) =>
    finding(
      'DESIGN-R-016',
      'mandatory',
      `${grid.items} items in ${grid.columns} columns leave one alone in the last row. Give a fixed set a column count that divides it, such as 2 columns for 4 items; show records in a CardList with layout="grid"`,
      grid.element,
    ),
  );
}
