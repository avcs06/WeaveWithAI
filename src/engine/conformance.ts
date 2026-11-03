import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Contract } from '../agents/03contract/schema';
import type { Check } from './session';

// The app's own check after a coding session: each screen's route folder,
// and the blocks it imports, against the contract. The guidelines ask for
// data through functions named after the operations, so a missing name is a
// screen that does not load its records, not a style choice.

/** What a screen's route folder, or a block it imports, must call: the operations that load what it and its dialogs show. */
export type ScreenExpect = { folder: string; operations: string[] };

/** A screen's folder and the operations that load it; a get drops out when the screen calls its entity's list, which holds each record. */
export function screenExpect(contract: Contract, folder: string, reads: string[]): ScreenExpect {
  const operations = new Set(reads);
  const listed = new Set(contract.operations.filter((op) => op.kind === 'list' && operations.has(op.id)).map((op) => op.entity));
  for (const op of contract.operations) if (op.kind === 'get' && listed.has(op.entity)) operations.delete(op.id);
  return { folder, operations: [...operations] };
}

function sourcesIn(dir: string): string {
  if (!existsSync(dir)) return '';
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => readFileSync(path.join(entry.parentPath, entry.name), 'utf8'))
    .join('\n');
}

/**
 * The code of each block that `code` imports, and of the blocks those import: a block shared by two screens
 * may load the records it shows. A route folder imports a block by its alias, a block a sibling by `../`.
 */
function blockSources(appDir: string, code: string, seen: Set<string>, inBlock = false): string[] {
  const from = inBlock ? /from\s+['"](?:@app\/blocks\/|\.\.\/)([^'"/]+)['"]/g : /from\s+['"]@app\/blocks\/([^'"/]+)['"]/g;
  return [...code.matchAll(from)].flatMap(([, name = '']) => {
    if (seen.has(name)) return [];
    seen.add(name);
    const text = sourcesIn(path.join(appDir, 'web/app/blocks', name));
    return [text, ...blockSources(appDir, text, seen, true)];
  });
}

export function checkScreen(appDir: string, expect: ScreenExpect): Check {
  const own = sourcesIn(path.join(appDir, expect.folder));
  const code = [own, ...blockSources(appDir, own, new Set())].join('\n');
  const lines = [
    ...(own ? [] : [`${expect.folder} has no code.`]),
    // An operation is called by its function or its hook: listBooks() or useListBooks().
    ...expect.operations
      .filter((op) => !new RegExp(`\\b(${op}|use${op.charAt(0).toUpperCase()}${op.slice(1)})\\b`).test(code))
      .map((op) => `Nothing in ${expect.folder} or the blocks it imports calls ${op}; load the screen's records through it.`),
  ];
  return { name: 'design', ok: lines.length === 0, output: lines.join('\n') };
}
