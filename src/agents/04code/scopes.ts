import { SUMMARY_HEAD, type Shot } from '../../engine/compose';
import type { ReviewScope } from '../../runner/runSpecStage';

// The UX reviewer's calls on a coding unit: a few screens each, with only
// their design, their code and their screenshots, so each call looks at every
// element of its screens. One call over 18 screens found almost nothing. Pure.

/** The screens one UX call judges. */
export const SCREENS_PER_UX_CALL = 3;

/** A screen the unit builds, and its route folder. */
export type UnitScreen = { id: string; folder: string };

/** A file of the unit's .weave folder: its path in .weave, such as `04-pages/S01.md`, and its text. */
export type WeaveFile = { path: string; text: string };

/** A .weave file as the unit's inputs show it. */
export const fileSection = (file: WeaveFile) => `## .weave/${file.path}\n\n${file.text}`;

/** The diff's file blocks by path, in order, and the agent's summary after them. */
function splitOutput(raw: string): { blocks: [string, string][]; summary: string } {
  const at = raw.indexOf(`\n\n${SUMMARY_HEAD}`);
  const diff = at === -1 ? raw : raw.slice(0, at);
  const starts = [...diff.matchAll(/^diff --git a\/(\S+) b\//gm)];
  const blocks = starts.map((match, i): [string, string] => [match[1] ?? '', diff.slice(match.index, starts[i + 1]?.index ?? diff.length)]);
  return { blocks, summary: at === -1 ? '' : raw.slice(at) };
}

/** A route folder's own files: those directly in it and in its `components/`, not the route folders inside it. */
const inFolder = (file: string, folder: string) => {
  if (!file.startsWith(`${folder}/`)) return false;
  const rest = file.slice(folder.length + 1);
  return !rest.includes('/') || rest.startsWith('components/');
};

/** The diff blocks of a screen: its folder's files, and the blocks and components they import, and those import. */
function screenBlocks(folder: string, blocks: [string, string][]): Set<string> {
  const kept = new Set(blocks.filter(([file]) => inFolder(file, folder)).map(([file]) => file));
  for (let grown = true; grown; ) {
    grown = false;
    for (const [file, text] of blocks.filter(([file]) => kept.has(file))) {
      // `@app/blocks/Cart`, or a sibling's `../Cart` inside blocks or components.
      const kind = file.match(/^web\/app\/(blocks|components)\//)?.[1];
      const names = [
        ...[...text.matchAll(/from ['"]@app\/(blocks|components)\/([^'"/]+)/g)].map((m) => `web/app/${m[1]}/${m[2]}/`),
        ...(kind ? [...text.matchAll(/from ['"]\.\.\/([^'"/]+)/g)].map((m) => `web/app/${kind}/${m[1]}/`) : []),
      ];
      for (const [other] of blocks)
        if (!kept.has(other) && names.some((prefix) => other.startsWith(prefix))) {
          kept.add(other);
          grown = true;
        }
    }
  }
  return kept;
}

/**
 * The UX reviewer's calls: screens in groups of SCREENS_PER_UX_CALL, each with the unit's files but the other
 * screens' designs, the diff of its screens' code, the summary and its screenshots. A unit with no screens of its
 * own, such as the frames, gets one call over the whole with every screenshot.
 */
export function uxScopes(screens: UnitScreen[], files: WeaveFile[], raw: string, shots: Shot[]): ReviewScope[] {
  if (!screens.length) return shots.length ? [{ images: shots }] : [];
  const { blocks, summary } = splitOutput(raw);
  const groups: UnitScreen[][] = [];
  for (let i = 0; i < screens.length; i += SCREENS_PER_UX_CALL) groups.push(screens.slice(i, i + SCREENS_PER_UX_CALL));
  // A screen's design file is its id, such as `04-pages/S01.md`; the template's screens, such as sign in, have one too.
  const designOf = (file: WeaveFile) => file.path.match(/\/(S\d+)\.md$/)?.[1];
  return groups.map((group) => {
    const ids = new Set(group.map((screen) => screen.id));
    const kept = new Set(group.flatMap((screen) => [...screenBlocks(screen.folder, blocks)]));
    return {
      user: files
        .filter((file) => {
          const design = designOf(file);
          return !design || ids.has(design);
        })
        .map(fileSection)
        .join('\n\n'),
      output: `${blocks.filter(([file]) => kept.has(file)).map(([, text]) => text).join('')}${summary}`,
      images: shots.filter((shot) => ids.has(shot.screen)),
    };
  });
}
