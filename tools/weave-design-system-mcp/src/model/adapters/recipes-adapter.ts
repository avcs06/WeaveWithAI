import { globSync } from 'node:fs';
import { basename, isAbsolute, resolve } from 'node:path';

/** A recipe file found by the config's globs. Its source is read when served, so edits show without a restart. */
export interface RecipeFile {
  /** The file's base name, e.g. "Table" for `Table.recipe.tsx`. */
  name: string;
  filePath: string;
}

/** Every file the `recipes` globs match, by name. */
export function loadRecipes(patterns: string[], configDir: string): RecipeFile[] {
  const files = new Set(
    patterns.flatMap((pattern) => globSync(isAbsolute(pattern) ? pattern : resolve(configDir, pattern))),
  );
  return [...files].sort().map((filePath) => ({
    name: basename(filePath).replace(/(\.recipe)?\.[cm]?[jt]sx?$/, ''),
    filePath,
  }));
}
