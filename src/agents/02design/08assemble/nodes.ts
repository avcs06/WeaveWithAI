import type { SCREEN_KINDS } from '../config';
import type { DesignNode } from '../schema';
import type { ModelNode } from '../06draw/schema';

// A draw, frame or invent call's node as a screen node (DS23): its own words,
// or the instance's words for the slot it stands for; a value it shows as its
// sample; and a heading's level and type size from the instance that places
// it, so a widget reads right wherever code places it.

type ScreenKind = (typeof SCREEN_KINDS)[number];

/** A heading's type size by its level, on app screens and marketing pages. */
export const HEADING_SIZES = {
  app: ['title', 'heading', 'subheading', 'body'],
  marketing: ['display', 'title', 'heading', 'subheading'],
} as const;

/** What an instance gives the nodes it places: its heading level and the words for its slots. */
export type InstanceWords = { level: number; words: Map<string, string> };

/** A frame's nodes take their levels as written and have no slots. */
export const AS_WRITTEN: InstanceWords = { level: 1, words: new Map() };

/**
 * A call's node as a screen node: the slot's or its own words, or its sample
 * when those hold a {Noun.attribute} or it has none, its heading level counted
 * from its instance's, and that level's type size.
 */
export function designNode(
  from: ModelNode & { section?: string },
  at: { id: string; section: string; parent: string },
  kind: ScreenKind,
  instance: InstanceWords,
): DesignNode {
  const { sample, slot, ...rest } = from;
  const words = slot ? (instance.words.get(slot) ?? '') : from.text;
  // The sample is the whole line as it shows, so it stands for words that hold a {Noun.attribute}.
  const shown = !words || (sample && /\{[^}]*\}/.test(words)) ? sample : words;
  const level =
    from.headingLevel > 0
      ? Math.min(4, Math.max(1, instance.level) + from.headingLevel - 1)
      : 0;
  return {
    ...rest,
    ...at,
    text: shown,
    headingLevel: level,
    typeScale: (level > 0 && HEADING_SIZES[kind][level - 1]) || from.typeScale,
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
