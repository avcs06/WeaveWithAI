import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import type { Theme } from '../../02design/01theme/build';

/** The template copied into `appDir` by its own generator, then installed; the MCP is built by `setupMcp`. */
export async function scaffoldApp(appDir: string): Promise<void> {
  await execa('node', ['template/tools/generate.mjs', 'template', appDir, '--skip-setup'], {
    stdio: 'inherit',
  });
  // The template is a pnpm workspace with its own lockfile pruned by the generator.
  await execa('pnpm', ['install', '--no-frozen-lockfile'], { cwd: appDir, stdio: 'inherit' });
}

/** The design-system MCP the coding agent connects to, installed and built inside the app. */
export async function setupMcp(appDir: string): Promise<void> {
  await execa('pnpm', ['mcp:setup'], { cwd: appDir, stdio: 'inherit' });
}

/** True when the app folder was made already; the scaffold runs once per app. */
export const scaffolded = (appDir: string) => existsSync(path.join(appDir, 'node_modules'));

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
