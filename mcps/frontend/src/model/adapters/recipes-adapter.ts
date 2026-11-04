import { globSync, readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, resolve } from 'node:path';

import { parse } from '@babel/parser';
import ts from 'typescript';

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

const compilerOptions = new Map<string, ts.CompilerOptions>();

/** Whether `source` resolves, through the nearest tsconfig's paths, to a workspace file rather than an installed package. */
function isWorkspaceModule(source: string, from: string): boolean {
  const tsconfig = ts.findConfigFile(dirname(from), ts.sys.fileExists);
  let options = tsconfig ? compilerOptions.get(tsconfig) : {};
  if (tsconfig && !options) {
    const { config } = ts.readConfigFile(tsconfig, ts.sys.readFile);
    options = ts.parseJsonConfigFileContent(config, ts.sys, dirname(tsconfig), {}, tsconfig).options;
    compilerOptions.set(tsconfig, options);
  }
  const { resolvedModule } = ts.resolveModuleName(source, from, options ?? {}, ts.sys);
  return Boolean(resolvedModule && !resolvedModule.isExternalLibraryImport);
}

/** The name `code` imports `needle` (lowercased) by from a workspace module, if it does. */
function workspaceImport(code: string, filePath: string, needle: string): string | undefined {
  const { body } = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    errorRecovery: true,
  }).program;
  for (const statement of body) {
    if (statement.type !== 'ImportDeclaration' || statement.importKind === 'type') continue;
    for (const specifier of statement.specifiers) {
      if (specifier.type !== 'ImportSpecifier' || specifier.importKind === 'type') continue;
      const name =
        specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value;
      if (name.toLowerCase() === needle && isWorkspaceModule(statement.source.value, filePath)) return name;
    }
  }
  return undefined;
}

/**
 * The recipe for a workspace export with none named after it, like a hook a
 * recipe teaches beside its main one: of the recipes importing it from the
 * workspace (not from an installed package), the one using it most.
 */
export function recipeImporting(recipes: RecipeFile[], name: string): RecipeFile | undefined {
  const needle = name.trim().toLowerCase();
  let best: RecipeFile | undefined;
  let most = 0;
  for (const recipe of recipes) {
    const code = readFileSync(recipe.filePath, 'utf8');
    const imported = workspaceImport(code, recipe.filePath, needle);
    const uses = imported ? code.split(imported).length - 1 : 0;
    if (uses > most) {
      best = recipe;
      most = uses;
    }
  }
  return best;
}
