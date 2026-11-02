import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Contract } from '../agents/03contract/schema';
import type { Check } from './session';

// The app's own check after a coding session: each screen's route folder
// against the contract. The guidelines ask for data through functions named
// after the operations, so a missing name is a screen that does not load its
// records, not a style choice.

/** What a screen's route folder must call: the operations that load what it and its dialogs show. */
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

export function checkScreen(appDir: string, expect: ScreenExpect): Check {
  const code = sourcesIn(path.join(appDir, expect.folder));
  const lines = [
    ...(code ? [] : [`${expect.folder} has no code.`]),
    // An operation is called by its function or its hook: listBooks() or useListBooks().
    ...expect.operations
      .filter((op) => !new RegExp(`\\b(${op}|use${op.charAt(0).toUpperCase()}${op.slice(1)})\\b`).test(code))
      .map((op) => `Nothing in ${expect.folder} calls ${op}; load the screen's records through it.`),
  ];
  return { name: 'design', ok: lines.length === 0, output: lines.join('\n') };
}
