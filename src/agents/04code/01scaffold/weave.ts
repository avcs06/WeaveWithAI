import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Issue } from '../../../core/issues';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Themed } from '../../02design/01theme/build';
import {
  dialogLines,
  frameLines,
  screenLines,
} from '../../02design/02architect/render';
import type {
  Architecture,
  Frame,
  Screen,
} from '../../02design/02architect/schema';
import type { Contract } from '../../03contract/schema';
import { behindSignIn } from '../rendered';

// The coding sessions' inputs: one numbered folder per code stage under
// .weave/, each with its guidelines and the slice of the run's artifacts its
// stage builds: the frames in prose, and each screen in prose with its
// dialogs and the operations that load it.

export type KnownIssue = Issue & { stage: string };
type QuestionRecord = {
  id: string;
  question: string;
  answer: string;
  from: string;
};

export type CodeInputs = {
  scope: Scope;
  flows: Flows;
  themed: Themed;
  contract: Contract;
  architecture: Architecture;
  questions: QuestionRecord[];
  known: KnownIssue[];
  /** A folder name ('01-scaffold') to its guidelines, for the stages that have them. */
  guidelines: Record<string, string>;
  /** The recipe index of packages/recipes, filled. */
  recipes: string;
};

export const SCAFFOLD = '01-scaffold';
export const CONTRACT = '02-contract';
export const FRAMES = '03-frames';
export const PAGES = '04-pages';

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/\bframe\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** A frame whose every screen is behind sign-in: it takes the app layout and sends visitors to the landing page. */
export function signedInFrame(
  architecture: Architecture,
  flows: Flows,
  scope: Scope,
  frame: Frame,
): boolean {
  const screens = architecture.screens.filter(
    (screen) => screen.frame === frame.id,
  );
  return (
    screens.length > 0 &&
    screens.every((screen) => behindSignIn(screen, flows, scope))
  );
}

/**
 * Each frame's route group. The first signed-in frame takes the template's
 * `app` group and the first other one its `marketing` group. A second frame of
 * a kind gets one from its name: "Admin frame" is `admin`, or its id when
 * that name is taken. A frame without screens has none.
 */
export function routeGroups(
  architecture: Architecture,
  flows: Flows,
  scope: Scope,
): Map<string, string> {
  const framed = architecture.frames.filter((frame) =>
    architecture.screens.some((screen) => screen.frame === frame.id),
  );
  const groups = new Map<string, string>();
  for (const frame of framed) {
    const group = signedInFrame(architecture, flows, scope, frame)
      ? 'app'
      : 'marketing';
    if (![...groups.values()].includes(group)) groups.set(frame.id, group);
  }
  for (const frame of framed.filter((f) => !groups.has(f.id))) {
    const name = slug(frame.name);
    const taken =
      [...groups.values()].includes(name) ||
      framed.some((f) => f.id !== frame.id && slug(f.name) === name);
    groups.set(frame.id, name && !taken ? name : frame.id.toLowerCase());
  }
  return groups;
}

/** The sign-in page: the screen given most to the flow that signs in, or the landing page when there is none. */
export function signInRoute(architecture: Architecture, flows: Flows): string {
  const signIn = new Set(flows.flows.filter((flow) => flow.authKind === 'signIn').map((flow) => flow.id));
  // The landing page may start the flow too; the sign-in page holds little else.
  const [page] = architecture.screens
    .filter((screen) => screen.flows.some((id) => signIn.has(id)))
    .sort((a, b) => a.flows.length - b.flows.length);
  return page?.route ?? '/';
}

/** A screen's route folder, inside its frame's route group. */
export function screenFolder(
  architecture: Architecture,
  flows: Flows,
  scope: Scope,
  screen: Screen,
): string {
  const group = routeGroups(architecture, flows, scope).get(screen.frame);
  const route = screen.route === '/' ? '' : screen.route;
  return `web/app/(routes)${group ? `/(${group})` : ''}${route}`;
}

/** The dialogs a screen opens. */
export const dialogsOf = (architecture: Architecture, screen: Screen) =>
  architecture.dialogs.filter((dialog) =>
    dialog.openedFrom.includes(screen.id),
  );

/** The operations that load what a screen and its dialogs show, by the contract's `screens`. */
export function screenReads(
  architecture: Architecture,
  contract: Contract,
  screen: Screen,
): string[] {
  const ids = new Set([
    screen.id,
    ...dialogsOf(architecture, screen).map((dialog) => dialog.id),
  ]);
  return [
    ...new Set(
      contract.screens
        .filter((entry) => ids.has(entry.screen))
        .flatMap((entry) => entry.reads),
    ),
  ];
}

/** The folder an issue goes to, from the id its `at` names: a frame's to the frames; a screen's, dialog's or flow's to the pages. */
export function issueOwner(at: string | undefined): string {
  const id = at?.split(/[\s:.]/)[0] ?? '';
  if (/^FR\d+$/.test(id)) return FRAMES;
  if (/^[SDF]\d+$/.test(id)) return PAGES;
  return SCAFFOLD;
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const text = (lines: string[]) => `${lines.join('\n').trim()}\n`;

/** Every file under .weave/ for the code stages, by path. Pure. */
export function weaveFolders(inputs: CodeInputs): Map<string, string> {
  const { architecture, scope, flows, themed, contract } = inputs;
  const groups = routeGroups(architecture, flows, scope);
  const files = new Map<string, string>();
  const put = (file: string, value: unknown) =>
    files.set(file, typeof value === 'string' ? value : json(value));

  for (const [folder, guidelines] of Object.entries(inputs.guidelines))
    put(`${folder}/guidelines.md`, guidelines);
  put(`${SCAFFOLD}/scope.json`, scope);
  put(`${SCAFFOLD}/flows.json`, flows);
  put(`${SCAFFOLD}/theme.json`, themed);
  put(`${SCAFFOLD}/contract.json`, contract);
  put(`${SCAFFOLD}/recipes.md`, inputs.recipes);
  put(
    `${SCAFFOLD}/routes.json`,
    architecture.screens.map((screen) => ({
      id: screen.id,
      title: screen.title,
      route: screen.route,
      folder: screenFolder(architecture, flows, scope, screen),
    })),
  );

  put(
    `${FRAMES}/frames.md`,
    text([
      '# Frames',
      ...architecture.frames.flatMap((frame) => {
        const screens = architecture.screens.filter(
          (screen) => screen.frame === frame.id,
        );
        const group = groups.get(frame.id);
        return [
          '',
          ...frameLines(frame),
          '',
          group
            ? `Route group: \`web/app/(routes)/(${group})/\`. Screens inside it: ${screens.map((screen) => `${screen.id} ${screen.route}`).join(', ')}.`
            : 'No screen sits in it, so it has no route group.',
          `Loads its records through: ${
            contract.screens
              .filter((entry) => entry.screen === frame.id)
              .flatMap((entry) => entry.reads)
              .join(', ') || 'nothing'
          }.`,
        ];
      }),
    ]),
  );

  for (const screen of architecture.screens) {
    const reads = screenReads(architecture, contract, screen);
    put(
      `${PAGES}/${screen.id}.md`,
      text([
        ...screenLines(screen),
        '',
        `Route folder: \`${screenFolder(architecture, flows, scope, screen)}\`.`,
        `Loads its records through: ${reads.join(', ') || 'nothing'}.`,
        ...dialogsOf(architecture, screen).flatMap((dialog) => [
          '',
          ...dialogLines(dialog),
        ]),
      ]),
    );
  }

  // Questions go to every session; each known issue to the folder its id names.
  const issues = new Map<string, KnownIssue[]>();
  for (const issue of inputs.known) {
    const owner = issueOwner(issue.at);
    issues.set(owner, [...(issues.get(owner) ?? []), issue]);
  }
  put(`${SCAFFOLD}/issues.json`, {
    questions: inputs.questions,
    known: issues.get(SCAFFOLD) ?? [],
  });
  for (const [owner, known] of issues)
    if (owner !== SCAFFOLD)
      put(`${owner}/issues.json`, { questions: [], known });
  return files;
}

export function writeWeave(appDir: string, files: Map<string, string>): void {
  for (const [file, value] of files) {
    const full = path.join(appDir, '.weave', file);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, value);
  }
}
