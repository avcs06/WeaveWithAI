import { createHash } from 'node:crypto';
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** JSON with keys sorted at every level and no whitespace, so equal data hashes equal. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, sortKeys(record[key])]),
  );
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export const hashOf = (value: unknown): string => sha256(canonicalJson(value));

/** Pretty JSON through a temp file and a rename, so a reader never sees a half-written file. */
export function writeJsonAtomic(file: string, value: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(`${file}.tmp`, file);
}

/** A file next to the calling module: `pathBeside(import.meta.url, './prompt.md')`. */
export function pathBeside(metaUrl: string, file: string): string {
  return fileURLToPath(new URL(file, metaUrl));
}

/** Every object key in a JSON-like value, nested arrays and objects included. */
export function keysOf(node: unknown): string[] {
  if (Array.isArray(node)) return node.flatMap(keysOf);
  if (typeof node !== 'object' || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) => [
    key,
    ...keysOf(value),
  ]);
}
