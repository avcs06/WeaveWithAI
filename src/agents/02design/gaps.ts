import type { ModelNode } from './07draw/schema';
import type { NodeLayout } from './schema';

// Code sets the gap of each column a widget or a new component stacks (H-01,
// user, 2026-11-01). The model picks the structure and never these numbers,
// so a fix no longer trades one spacing rule for another.

/** What a column's kind reads of a node. */
type Kid = Pick<ModelNode, 'id' | 'role' | 'component' | 'what' | 'layout'>;

/**
 * What a column stacks: a title and its description; text alone; the
 * repeated items of a list, which keep their row rhythm (H-10); two or more
 * groups, which are columns of two or more nodes; content, with at most one
 * group; a header above two or more groups, which no one gap fits; or one node.
 */
export type Stack = 'header' | 'text' | 'list' | 'groups' | 'content' | 'mixed' | 'one';

/** Spacing keys: 1 is 4px, 4 is 16px, 6 is 24px. The others keep the model's gap. */
const GAP: Partial<Record<Stack, string>> = { header: '1', content: '4', groups: '6' };

export function stackOf(kids: Kid[], kidsOf: (id: string) => Kid[], lists: boolean): Stack {
  if (kids.length < 2) return 'one';
  const [first, ...rest] = kids;
  const titled = (stack: Kid[]) =>
    stack.length >= 2 && stack[0]?.role === 'heading' && stack.slice(1).every((k) => k.role === 'text');
  if (titled(kids)) return 'header';
  if (kids.every((k) => k.role === 'text')) return 'text';
  if (lists && largestRepeat(kids) >= 2) return 'list';
  const isHeader = (k: Kid | undefined) =>
    k?.role === 'heading' || (k?.layout?.direction === 'column' && titled(kidsOf(k.id)));
  const isGroup = (k: Kid) =>
    k.role === 'container' && k.component === 'none' && k.layout?.direction === 'column' && kidsOf(k.id).length >= 2 && !isHeader(k);
  const below = isHeader(first) ? rest : kids;
  if (below.filter(isGroup).length < 2) return 'content';
  return below === kids ? 'groups' : 'mixed';
}

/** The most siblings that share a component, or a `what` when they are plain boxes, as LAYOUT-010 counts them. */
function largestRepeat(kids: Kid[]): number {
  const counts = new Map<string, number>();
  for (const k of kids) {
    const key = k.component === 'none' ? `what:${k.what}` : k.component;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Math.max(0, ...counts.values());
}

/** A build or a component design with the gap of each column set by its stack; `lists` when it shows in a list or cards section. */
export function withFixedGaps<T extends { layout: NodeLayout; nodes: ModelNode[] }>(drawn: T, lists: boolean): T {
  const kidsOf = (id: string) =>
    drawn.nodes.filter((n) => n.parent === id).sort((a, b) => a.order - b.order);
  const gapped = <L extends NodeLayout | null>(layout: L, id: string): L => {
    if (layout?.direction !== 'column') return layout;
    const gap = GAP[stackOf(kidsOf(id), kidsOf, lists)];
    return gap ? { ...layout, gap } : layout;
  };
  return {
    ...drawn,
    layout: gapped(drawn.layout, ''),
    nodes: drawn.nodes.map((n) => ({ ...n, layout: gapped(n.layout, n.id) })),
  };
}
