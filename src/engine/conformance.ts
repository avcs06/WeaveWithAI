import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Contract } from '../agents/03contract/schema';
import type { Check } from './session';

// The app's own checks after a coding session (FE10): the route folder against
// the screen's design and the contract. The guidelines ask for a data-testid
// per node and for data through functions named after the operations, so a
// missing name is a missing element or an unwired widget, not a style choice.

/** What a screen's route folder must name: its nodes' test ids and words, and the operations its widgets read. */
export type ScreenExpect = { folder: string; testIds: string[]; words?: NodeWords[]; operations: string[] };

/** A node's own words: its text or label as the design writes it. */
export type NodeWords = { id: string; text: string };

/**
 * The words of these nodes that code must show as written: none that holds a {Noun.attribute} value, and no
 * text of a node that shows data, since that text is a sample of the record's value.
 */
export function nodeWords(nodes: { id: string; text: string; label: string; data: string[] }[]): NodeWords[] {
  return nodes.flatMap((node) =>
    [node.data.length ? '' : node.text, node.label].filter((text) => text.trim() && !text.includes('{')).map((text) => ({ id: node.id, text: text.trim() })),
  );
}

type Design = {
  screens: { id: string; route: string; parent: string }[];
  nodes: { id: string; section: string; text: string; label: string; data: string[] }[];
  sections: { id: string; screen: string }[];
  placements: { screen: string; widget: string }[];
};

/** A page and its dialogs: their nodes' ids, and the operations that load their widgets. */
export function screenExpect(design: Design, contract: Contract, screen: string): ScreenExpect {
  const page = design.screens.find((s) => s.id === screen);
  if (!page) throw new Error(`no screen ${screen} in the design`);
  const ids = new Set([screen, ...design.screens.filter((s) => s.parent === screen).map((s) => s.id)]);
  const sections = new Set(design.sections.filter((s) => ids.has(s.screen)).map((s) => s.id));
  const widgets = new Set(design.placements.filter((p) => ids.has(p.screen)).map((p) => p.widget));
  // Not every operation of the screen's steps: a step's effect may run inside another, as duplicating a dashboard copies its widgets.
  const operations = new Set(contract.widgets.filter((w) => widgets.has(w.widget)).flatMap((w) => w.reads));
  const nodes = design.nodes.filter((n) => sections.has(n.section));
  return {
    folder: path.join('web/app/(routes)', page.route.replace(/^\//, '')),
    testIds: nodes.map((n) => n.id),
    words: nodeWords(nodes),
    operations: [...operations],
  };
}

function sourcesIn(dir: string): string {
  if (!existsSync(dir)) return '';
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => readFileSync(path.join(entry.parentPath, entry.name), 'utf8'))
    .join('\n');
}

/** Code text as it shows: JSX entities read as their characters, runs of space as one. */
const shown = (text: string) =>
  text
    .replace(/&apos;|&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

export function checkScreen(appDir: string, expect: ScreenExpect): Check {
  const code = sourcesIn(path.join(appDir, expect.folder));
  const text = shown(code);
  const lines = [
    ...(code || !(expect.testIds.length || expect.words?.length || expect.operations.length) ? [] : [`${expect.folder} has no code.`]),
    ...expect.testIds.filter((id) => !code.includes(id)).map((id) => `No element has data-testid "${id}".`),
    ...(expect.words ?? [])
      .filter((w) => !text.includes(shown(w.text)))
      .map((w) => `The words "${w.text}" of ${w.id} are nowhere in ${expect.folder}; show the node's text as the design writes it.`),
    ...expect.operations
      .filter((op) => !new RegExp(`\\b${op}\\b`).test(code))
      .map((op) => `Nothing in ${expect.folder} calls ${op}; load the widget's data through it.`),
  ];
  // Missing words are a warning: they never fail the check, only show in its output.
  const failing = lines.filter((line) => !line.startsWith('The words '));
  return { name: 'design', ok: failing.length === 0, output: lines.join('\n') };
}
