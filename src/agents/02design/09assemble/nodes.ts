import type { SCREEN_KINDS } from '../config';
import type { DesignNode } from '../schema';
import type { Copy } from '../03architect/schema';
import type { ModelNode } from '../07draw/schema';

// A widget or frame call's node as a screen node (DS23): its copy ids become
// text, a value it shows its sample, and a heading takes the type size of its
// level, so a widget reads the same wherever code places it.

type ScreenKind = (typeof SCREEN_KINDS)[number];

/** A heading's type size by its level, on app screens and marketing pages. */
export const HEADING_SIZES = {
  app: ['title', 'heading', 'subheading', 'body'],
  marketing: ['display', 'title', 'heading', 'subheading'],
} as const;

/** A lookup from copy id to its text; an id not in the deck stays as written, for the copy rules to flag. */
export type CopyText = (id: string) => string;
export function copyText(deck: Copy[]): CopyText {
  const byId = new Map(deck.map((c) => [c.id, c.text]));
  return (id) => (id ? (byId.get(id) ?? id) : '');
}

/**
 * A call's node as a screen node: its copy as text, every {Noun.attribute}
 * slot showing its sample (or the sample alone), and a heading's type size
 * from its level on a screen of `kind`.
 */
export function designNode(
  from: ModelNode & { section?: string },
  at: { id: string; section: string; parent: string },
  kind: ScreenKind,
  text: CopyText,
): DesignNode {
  const { sample, ...rest } = from;
  return {
    ...rest,
    ...at,
    text: from.text
      ? text(from.text).replace(/\{[^}]*\}/g, (slot) => sample || slot)
      : sample,
    label: text(from.label),
    typeScale:
      (from.headingLevel > 0 && HEADING_SIZES[kind][from.headingLevel - 1]) ||
      from.typeScale,
  };
}

/** A tree's nodes depth first, each level by order; a node off the tree follows, for the id rules to flag. */
export function depthFirst<
  T extends { id: string; parent: string; order: number },
>(nodes: T[]): T[] {
  const out = new Set<T>();
  const walk = (parent: string) => {
    for (const node of nodes
      .filter((n) => n.parent === parent)
      .sort((a, b) => a.order - b.order)) {
      if (out.has(node)) continue;
      out.add(node);
      walk(node.id);
    }
  };
  walk('');
  for (const node of nodes) if (!out.has(node)) (out.add(node), walk(node.id));
  return [...out];
}
