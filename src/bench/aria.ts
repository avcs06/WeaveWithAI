// What a screen reader gets from a page, from Playwright's `ariaSnapshot()`:
// one `- role "name" [attrs]` line per node, indented by depth.

export type TreeReport = { nodes: number; unnamedControls: string[]; mains: number; h1s: number; skippedLevels: number };

const CONTROLS = new Set(['button', 'link', 'textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'slider', 'spinbutton', 'option']);
const NODE = /^\s*- ([a-z]+)(?: "((?:[^"\\]|\\.)*)")?(?: \[([^\]]*)\])?:?/;

/** Counts from the snapshot; `skip` names nodes that are not the app's, such as `next dev`'s own overlay button. */
export function readTree(snapshot: string, skip: RegExp = /Next\.js/): TreeReport {
  const report: TreeReport = { nodes: 0, unnamedControls: [], mains: 0, h1s: 0, skippedLevels: 0 };
  let level = 0;
  for (const line of snapshot.split('\n')) {
    const match = NODE.exec(line);
    // `- text: …` and `- /url: …` are a node's text and properties, not nodes.
    if (!match || line.trimStart().startsWith('- text:')) continue;
    const [, role = '', name = '', attrs = ''] = match;
    if (skip.test(name)) continue;
    report.nodes += 1;
    if (CONTROLS.has(role) && !name.trim()) report.unnamedControls.push(role);
    if (role === 'main') report.mains += 1;
    if (role === 'heading') {
      const next = Number(/level=(\d)/.exec(attrs)?.[1] ?? 0);
      if (next === 1) report.h1s += 1;
      if (next > level + 1) report.skippedLevels += 1;
      level = next;
    }
  }
  return report;
}
