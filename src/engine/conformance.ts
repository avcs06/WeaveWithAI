import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Contract } from '../agents/03contract/schema';
import type { Check } from './session';

// The app's own checks after a coding session (FE10): the route folder against
// the screen's design and the contract. The guidelines ask for a data-testid
// per node and for data through functions named after the operations, so a
// missing name is a missing element or an unwired widget, not a style choice.

/** What a screen's route folder must name. */
export type ScreenExpect = { folder: string; testIds: string[]; operations: string[] };

type Design = {
  screens: { id: string; route: string; parent: string }[];
  nodes: { id: string; section: string }[];
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
  return {
    folder: path.join('web/app/(routes)', page.route.replace(/^\//, '')),
    testIds: design.nodes.filter((n) => sections.has(n.section)).map((n) => n.id),
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

export function checkScreen(appDir: string, expect: ScreenExpect): Check {
  const code = sourcesIn(path.join(appDir, expect.folder));
  const lines = [
    ...(code ? [] : [`${expect.folder} has no code.`]),
    ...expect.testIds.filter((id) => !code.includes(id)).map((id) => `No element has data-testid "${id}".`),
    ...expect.operations
      .filter((op) => !new RegExp(`\\b${op}\\b`).test(code))
      .map((op) => `Nothing in ${expect.folder} calls ${op}; load the widget's data through it.`),
  ];
  return { name: 'design', ok: lines.length === 0, output: lines.join('\n') };
}
