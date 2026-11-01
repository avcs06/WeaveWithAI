import type { WidgetScreens } from '../../02design/08assemble/assemble';

// The order the pages are built in. A page depends on the
// pages it opens. Pages that open each other are one group, built in one
// session; each wave holds the groups whose pages open only their own group
// or groups of earlier waves, so every link works by the time it is checked.

export type PageGroup = {
  /** The group's pages, in navigation order. */
  pages: string[];
  /** 1 for a group that opens no other group; one more than the latest group it opens otherwise. */
  wave: number;
  /** The pages of other groups it opens, all built in earlier waves. */
  opens: string[];
};

/** Which page each screen belongs to: a page itself, or the page its dialog opens from. */
function pageOf(design: WidgetScreens): (screen: string) => string | undefined {
  const byId = new Map(design.screens.map((s) => [s.id, s]));
  return (screen) => {
    let at = byId.get(screen);
    while (at && at.type !== 'page' && at.parent) at = byId.get(at.parent);
    return at?.type === 'page' ? at.id : undefined;
  };
}

/** Each page and the pages its nodes and its dialogs' nodes open. */
export function pageLinks(design: WidgetScreens): Map<string, Set<string>> {
  const page = pageOf(design);
  const screenOf = new Map(design.sections.map((s) => [s.id, s.screen]));
  const links = new Map(design.screens.filter((s) => s.type === 'page').map((s) => [s.id, new Set<string>()]));
  for (const node of design.nodes) {
    const from = page(screenOf.get(node.section) ?? '');
    const to = node.navigatesTo ? page(node.navigatesTo) : undefined;
    if (from && to && from !== to) links.get(from)?.add(to);
  }
  return links;
}

/** The pages' groups, in build order: by wave, then by where their first page sits in the navigation. */
export function pageGroups(design: WidgetScreens): PageGroup[] {
  const links = pageLinks(design);
  const order = design.navigation.items.map((item) => item.screen);
  const rank = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
  const byRank = (a: string, b: string) => rank(a) - rank(b) || a.localeCompare(b);

  // Tarjan's strongly connected components: the pages that reach each other.
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const groups: string[][] = [];
  const visit = (page: string) => {
    index.set(page, index.size);
    low.set(page, index.get(page)!);
    stack.push(page);
    for (const next of links.get(page) ?? []) {
      if (!index.has(next)) {
        visit(next);
        low.set(page, Math.min(low.get(page)!, low.get(next)!));
      } else if (stack.includes(next)) low.set(page, Math.min(low.get(page)!, index.get(next)!));
    }
    if (low.get(page) !== index.get(page)) return;
    const group: string[] = [];
    for (let top = stack.pop(); top !== undefined; top = top === page ? undefined : stack.pop()) group.push(top);
    groups.push(group.sort(byRank));
  };
  for (const page of [...links.keys()].sort(byRank)) if (!index.has(page)) visit(page);

  const groupOf = new Map(groups.flatMap((group, i) => group.map((page) => [page, i] as const)));
  const opens = groups.map((group) => [...new Set(group.flatMap((page) => [...(links.get(page) ?? [])]))].filter((p) => !group.includes(p)).sort(byRank));
  const waves = new Map<number, number>();
  const wave = (i: number): number => {
    if (!waves.has(i)) waves.set(i, 1 + Math.max(0, ...opens[i]!.map((page) => wave(groupOf.get(page)!))));
    return waves.get(i)!;
  };
  return groups
    .map((pages, i) => ({ pages, wave: wave(i), opens: opens[i]! }))
    .sort((a, b) => a.wave - b.wave || byRank(a.pages[0]!, b.pages[0]!));
}
