import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Issue } from '../../../core/issues';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Themed } from '../../02design/01theme/build';
import type { WidgetScreens } from '../../02design/08assemble/assemble';
import type { DesignNode } from '../../02design/schema';
import type { Contract } from '../../03contract/schema';

// The coding sessions' inputs: one numbered folder per code stage under
// .weave/, each with its guidelines and the slice of the run's artifacts its
// stage builds. A page reads only its own folder of 05-pages.

export type KnownIssue = Issue & { stage: string };
type QuestionRecord = { id: string; question: string; answer: string; from: string };

export type CodeInputs = {
  scope: Scope;
  flows: Flows;
  themed: Themed;
  contract: Contract;
  design: WidgetScreens;
  questions: QuestionRecord[];
  known: KnownIssue[];
  /** A folder name ('01-scaffold') to its guidelines, for the stages that have them. */
  guidelines: Record<string, string>;
  /** The recipe index of packages/recipes, filled. */
  recipes: string;
};

export const SCAFFOLD = '01-scaffold';
export const CONTRACT = '02-contract';
export const SHARED = '03-shared';
export const FRAMES = '04-frames';
export const PAGES = '05-pages';

/** What two or more screens use: widgets placed on several screens, and dialogs opened from several pages. */
export function sharedUnits(design: WidgetScreens): { widgets: Set<string>; dialogs: Set<string> } {
  const screensOf = new Map<string, Set<string>>();
  for (const p of design.placements) screensOf.set(p.widget, (screensOf.get(p.widget) ?? new Set()).add(p.screen));
  const widgets = new Set([...screensOf].filter(([, screens]) => screens.size > 1).map(([widget]) => widget));
  const openers = new Map<string, Set<string>>();
  for (const node of design.nodes) {
    const target = design.screens.find((s) => s.id === node.navigatesTo && s.type === 'dialog');
    const screen = screenOfNode(design, node);
    if (!target || !screen) continue;
    openers.set(target.id, (openers.get(target.id) ?? new Set()).add(pageOf(design, screen)));
  }
  const dialogs = new Set([...openers].filter(([, pages]) => pages.size > 1).map(([dialog]) => dialog));
  return { widgets, dialogs };
}

/** A dialog's page is its parent; a page is its own. */
function pageOf(design: WidgetScreens, screen: string): string {
  const found = design.screens.find((s) => s.id === screen);
  return found?.type === 'dialog' && found.parent ? found.parent : screen;
}

/** The screen a node sits on, or undefined for a shell's node. */
function screenOfNode(design: WidgetScreens, node: DesignNode): string | undefined {
  return design.sections.find((s) => s.id === node.section)?.screen;
}

/** The folders an issue goes to, from the id its `at` names. */
export function issueOwners(at: string | undefined, design: WidgetScreens, shared = sharedUnits(design)): string[] {
  if (!at) return [SCAFFOLD];
  const id = at.split(/[\s:]/)[0] ?? at;
  if (/^SH\d+/.test(id)) return [FRAMES];
  if (design.newComponents.some((c) => c.name === id)) return [SHARED];
  if (design.widgets.some((w) => w.id === id)) return shared.widgets.has(id) ? [SHARED] : pagesPlacing(design, id);
  const screen = id.split('.')[0] ?? '';
  if (design.screens.some((s) => s.id === screen)) return [screenFolder(design, screen, shared)];
  if (/^F\d+\.[SA]\d+$/.test(id)) {
    const owners = design.nodes
      .filter((node) => node.flowSteps.includes(id))
      .map((node) => (node.id.startsWith('SH') ? FRAMES : screenFolder(design, screenOfNode(design, node) ?? '', shared)));
    return owners.length ? [...new Set(owners)] : [SCAFFOLD];
  }
  return [SCAFFOLD];
}

function screenFolder(design: WidgetScreens, screen: string, shared: ReturnType<typeof sharedUnits>): string {
  return shared.dialogs.has(screen) ? SHARED : `${PAGES}/${pageOf(design, screen)}`;
}

function pagesPlacing(design: WidgetScreens, widget: string): string[] {
  const pages = design.placements.filter((p) => p.widget === widget).map((p) => `${PAGES}/${pageOf(design, p.screen)}`);
  return pages.length ? [...new Set(pages)] : [SCAFFOLD];
}

/** The flows' steps and alternatives with these ids, grouped by their flow. */
function stepsOf(flows: Flows, ids: Set<string>) {
  return [...flows.flows, ...flows.subflows]
    .map((flow) => ({
      flow: flow.id,
      name: flow.name,
      steps: flow.steps.filter((step) => ids.has(step.id)),
      alternatives: flow.alternatives.filter((alt) => ids.has(alt.id)),
    }))
    .filter((flow) => flow.steps.length || flow.alternatives.length);
}

/** Everything a group of screens draws: their sections, placements and nodes, the steps they serve and the operations their widgets read. */
function screensSlice(inputs: CodeInputs, screens: string[], shared: ReturnType<typeof sharedUnits>) {
  const { design, flows, contract } = inputs;
  const ids = new Set(screens);
  const sections = design.sections.filter((s) => ids.has(s.screen));
  const sectionIds = new Set(sections.map((s) => s.id));
  const placements = design.placements
    .filter((p) => ids.has(p.screen))
    .map((p) => ({ ...p, shared: shared.widgets.has(p.widget) }));
  const widgets = new Set(placements.map((p) => p.widget));
  const operations = new Set(contract.widgets.filter((w) => widgets.has(w.widget)).flatMap((w) => w.reads));
  const drawn = design.screens.filter((s) => ids.has(s.id));
  return {
    screens: drawn,
    sections,
    placements,
    widgets: design.widgets.filter((w) => widgets.has(w.id) && !shared.widgets.has(w.id)),
    nodes: design.nodes.filter((n) => sectionIds.has(n.section)),
    steps: stepsOf(flows, new Set(drawn.flatMap((s) => s.flowSteps))),
    operations: contract.operations.filter((o) => operations.has(o.id)),
  };
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/** Every file under .weave/ for the code stages, by path. Pure. */
export function weaveFolders(inputs: CodeInputs): Map<string, string> {
  const { design, scope, flows, themed, contract } = inputs;
  const shared = sharedUnits(design);
  const files = new Map<string, string>();
  const put = (file: string, value: unknown) => files.set(file, typeof value === 'string' ? value : json(value));

  for (const [folder, text] of Object.entries(inputs.guidelines)) put(`${folder}/guidelines.md`, text);
  put(`${SCAFFOLD}/scope.json`, scope);
  put(`${SCAFFOLD}/flows.json`, flows);
  put(`${SCAFFOLD}/theme.json`, themed);
  put(`${SCAFFOLD}/contract.json`, contract);
  put(`${SCAFFOLD}/recipes.md`, inputs.recipes);
  put(
    `${SCAFFOLD}/routes.json`,
    design.screens.map(({ id, name, type, route, parent, access }) => ({ id, name, type, route, parent, access })),
  );

  for (const component of design.newComponents) put(`${SHARED}/components/${component.name}.json`, component);
  for (const widget of design.widgets.filter((w) => shared.widgets.has(w.id))) {
    const placements = design.placements.filter((p) => p.widget === widget.id);
    put(`${SHARED}/widgets/${widget.id}.json`, {
      widget,
      placements: placements.map((p) => ({ ...p, nodes: design.nodes.filter((n) => n.section === p.id) })),
      operations: contract.widgets.find((w) => w.widget === widget.id)?.reads ?? [],
    });
  }
  for (const dialog of shared.dialogs) put(`${SHARED}/dialogs/${dialog}.json`, screensSlice(inputs, [dialog], shared));

  for (const shell of design.shells)
    put(`${FRAMES}/shells/${shell.id}.json`, {
      shell,
      nodes: design.nodes.filter((n) => n.id.startsWith(`${shell.id}.`)),
      screens: design.screens.filter((s) => s.shell === shell.id).map((s) => s.id),
    });
  put(`${FRAMES}/navigation.json`, design.navigation);
  put(`${FRAMES}/frame-changes.json`, design.frameChanges);

  for (const page of design.screens.filter((s) => s.type !== 'dialog')) {
    const own = design.screens.filter((s) => s.parent === page.id && s.type === 'dialog' && !shared.dialogs.has(s.id));
    put(`${PAGES}/${page.id}/page.json`, {
      ...screensSlice(inputs, [page.id, ...own.map((s) => s.id)], shared),
      sharedDialogs: [...shared.dialogs].filter((d) => design.nodes.some((n) => n.navigatesTo === d && pageOf(design, screenOfNode(design, n) ?? '') === page.id)),
    });
  }

  // Questions go to every session; each known issue to the folders its id names.
  const issues = new Map<string, KnownIssue[]>();
  for (const issue of inputs.known)
    for (const owner of issueOwners(issue.at, design, shared)) issues.set(owner, [...(issues.get(owner) ?? []), issue]);
  put(`${SCAFFOLD}/issues.json`, { questions: inputs.questions, known: issues.get(SCAFFOLD) ?? [] });
  for (const [owner, known] of issues) if (owner !== SCAFFOLD) put(`${owner}/issues.json`, { questions: [], known });
  return files;
}

export function writeWeave(appDir: string, files: Map<string, string>): void {
  for (const [file, text] of files) {
    const full = path.join(appDir, '.weave', file);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, text);
  }
}
