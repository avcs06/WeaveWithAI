import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, extname } from 'node:path';

import { register } from 'tsx/cjs/api';

import type { DesignToken } from '../../types.js';
import { tokenReference } from './flatten-object-literal.js';

/** Flattens a real (already-evaluated) JS value — a parsed JSON file or a module's export. */
function flattenPlainValue(
  value: unknown,
  pathSoFar: string[],
  referenceRoot: string,
  tokens: DesignToken[],
): void {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    if (pathSoFar.length === 0) return; // the root itself isn't a leaf
    const name = pathSoFar.join('.');
    const reference = tokenReference(referenceRoot, pathSoFar);
    if (typeof value === 'string' || typeof value === 'number') {
      tokens.push({ name, group: pathSoFar[0]!, reference, value: String(value) });
    } else if (value === null) {
      tokens.push({ name, group: pathSoFar[0]!, reference });
    }
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    flattenPlainValue(child, [...pathSoFar, key], referenceRoot, tokens);
  }
}

interface FileScope {
  setFileScope(filePath: string): void;
  endFileScope(): void;
}

/**
 * Runs a token module and returns its exports, so imports, spreads and
 * computed values resolve to what the code reads. tsx compiles the TypeScript;
 * in a vanilla-extract project the module runs inside a file scope (as its
 * build plugin would) so `.css.ts` imports calling `createVar`/`style` load,
 * taken from the project's own vanilla-extract install.
 */
function evaluateModule(filePath: string): Record<string, unknown> {
  const load = createRequire(filePath);
  let fileScope: FileScope | undefined;
  try {
    fileScope = load('@vanilla-extract/css/fileScope') as FileScope;
  } catch {
    // Not a vanilla-extract project — nothing in the graph needs a file scope.
  }

  const unregister = register();
  fileScope?.setFileScope(filePath);
  try {
    return load(filePath) as Record<string, unknown>;
  } finally {
    fileScope?.endFileScope();
    unregister();
  }
}

/**
 * Reads a plain token object (a JSON file, or a TS/JS module's exported,
 * possibly nested, objects) and flattens it into a token list. A module is
 * executed, not parsed, so objects assembled from imports (`...base`,
 * `color: colorTokens`, helper calls) yield every leaf they have at runtime.
 *
 * A JSON file's tokens are referenced by its basename; a module's by each
 * exported object's own name.
 */
export function loadTokens(filePath: string): DesignToken[] {
  const tokens: DesignToken[] = [];

  if (extname(filePath) === '.json') {
    flattenPlainValue(JSON.parse(readFileSync(filePath, 'utf8')), [], basename(filePath, '.json'), tokens);
    return tokens;
  }

  const objects = Object.entries(evaluateModule(filePath)).filter(
    ([, value]) => value !== null && typeof value === 'object' && !Array.isArray(value),
  );
  if (objects.length === 0) throw new Error(`No exported object found in ${filePath}.`);
  for (const [name, value] of objects) flattenPlainValue(value, [], name, tokens);
  return tokens;
}
