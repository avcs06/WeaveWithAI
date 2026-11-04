import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Theme } from '../../02design/01theme/build';
import {
  type AccountWiring,
  type Kind,
  layoutParts,
  layoutPath,
  layoutSource,
  partDoc,
  partFolder,
  partPath,
  partSource,
  pascal,
  TEMPLATE_PARTS,
} from '../parts';

// The app's and the marketing site's layouts from the template's parts. A part
// the theme's layout needs keeps the template's guidance, with what the theme
// puts there and the logo and the account where the theme put them; the others
// are dropped. Each layout file renders the parts left, and the app's sends a
// visitor who is not signed in to the landing page.

export const LAYOUT_DOCS: Record<Kind, string> = {
  app: "The app a signed-in user works in, in the theme's app layout.",
  marketing: "The public site: the landing page, sign in and sign up, in the theme's marketing layout.",
};

export const layoutName = (kind: Kind) => `${pascal(kind)}Layout`;

/** The files both layouts write, from the template's parts as `read` gives them, and the part folders they drop. Pure. */
export function scaffoldLayouts(
  theme: Theme,
  read: (file: string) => string | undefined,
  wiring: AccountWiring,
): { files: Map<string, string>; removed: string[] } {
  const files = new Map<string, string>();
  const removed: string[] = [];
  for (const kind of ['app', 'marketing'] as const) {
    const parts = layoutParts(pascal(kind), theme.layouts[kind]);
    for (const part of parts)
      files.set(partPath(part.name), partSource(part, partDoc(read(partPath(part.name)), part.name), wiring));
    for (const name of TEMPLATE_PARTS[kind])
      if (!parts.some((part) => part.name === name)) removed.push(partFolder(name));
    files.set(layoutPath(kind), layoutSource(layoutName(kind), LAYOUT_DOCS[kind], kind, parts, kind === 'app'));
  }
  return { files, removed };
}

/** Writes `scaffoldLayouts` into the app: the files it wrote, and the files it removed with their folders. */
export function applyLayouts(
  appDir: string,
  theme: Theme,
  wiring: AccountWiring,
): { changed: string[]; removed: string[] } {
  const full = (file: string) => path.join(appDir, file);
  const read = (file: string) => (existsSync(full(file)) ? readFileSync(full(file), 'utf8') : undefined);
  const { files, removed } = scaffoldLayouts(theme, read, wiring);
  const changed = [...files].filter(([file, text]) => read(file) !== text).map(([file]) => file);
  for (const file of changed) writeFileSync(full(file), files.get(file)!);
  const gone = removed
    .filter((folder) => existsSync(full(folder)))
    .flatMap((folder) => readdirSync(full(folder)).map((name) => `${folder}/${name}`));
  for (const folder of removed) rmSync(full(folder), { recursive: true, force: true });
  return { changed, removed: gone };
}
