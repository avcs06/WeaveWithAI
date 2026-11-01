import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import { git } from '../../../engine/setup';
import type { Theme } from '../../02design/01theme/build';

/** The template copied by its own generator, installed, and the design-system MCP the agent connects to built inside it. */
async function copyTemplate(appDir: string): Promise<void> {
  await execa('node', ['template/tools/generate.mjs', 'template', appDir, '--skip-setup'], {
    stdio: 'inherit',
  });
  // The template is a pnpm workspace with its own lockfile pruned by the generator.
  await execa('pnpm', ['install', '--no-frozen-lockfile'], { cwd: appDir, stdio: 'inherit' });
  await execa('pnpm', ['mcp:setup'], { cwd: appDir, stdio: 'inherit' });
}

/** Written once the copy is complete, so a folder without it is not the scaffold's app. */
const MARKER = '.weave/scaffold.json';

/**
 * The run's app, for the code stages and `weave app` alike: made from the
 * template once and reused after. A folder the scaffold did not make, such as
 * a trial app, is moved aside to `app.previous-<time>`, never deleted.
 */
export async function ensureApp(
  appDir: string,
  copy: (appDir: string) => Promise<void> = copyTemplate,
): Promise<{ made: boolean; movedAside?: string }> {
  if (existsSync(path.join(appDir, MARKER)) && existsSync(path.join(appDir, 'node_modules'))) return { made: false };
  let movedAside: string | undefined;
  if (existsSync(appDir)) {
    movedAside = `${appDir}.previous-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    renameSync(appDir, movedAside);
  }
  await copy(appDir);
  mkdirSync(path.join(appDir, '.weave'), { recursive: true });
  writeFileSync(path.join(appDir, MARKER), `${JSON.stringify({ madeAt: new Date().toISOString() }, null, 2)}\n`);
  // The template as copied is the first commit, so every step after it is a diff to review.
  git(appDir, 'init', '-q');
  git(appDir, 'add', '-A');
  git(appDir, 'commit', '-q', '-m', 'template: a fresh copy');
  return { made: true, movedAside };
}

const SYSTEM_MODE = /const isDark = [^;\n]+;/;

/** UIRoot's mode script with the theme's one mode fixed, so a light-only or dark-only app never opens in the other. */
export function pinMode(text: string, theme: Theme): string {
  if (theme.modes.length !== 1) return text;
  if (!SYSTEM_MODE.test(text)) throw new Error('no isDark line in UIRoot to pin');
  return text.replace(SYSTEM_MODE, `const isDark = ${theme.modes[0] === 'dark'};`);
}

/** Writes `pinMode` into the app's UIRoot; true when it changed the file. */
export function applyMode(appDir: string, theme: Theme): boolean {
  const file = path.join(appDir, 'packages/ui/src/Root/UIRoot.tsx');
  const before = readFileSync(file, 'utf8');
  const after = pinMode(before, theme);
  if (after === before) return false;
  writeFileSync(file, after);
  return true;
}
