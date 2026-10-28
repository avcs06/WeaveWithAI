import { globSync } from 'node:fs';
import { basename, dirname, isAbsolute, resolve } from 'node:path';

import { withCompilerOptions, type ComponentDoc } from 'react-docgen-typescript';
import ts from 'typescript';

import type { ComponentContract } from '../../types.js';
import { toProps } from './props.js';

/**
 * Stories, tests and recipes sit beside components, so a `components/**\/*.tsx`
 * glob sweeps them up, and docgen would report a CSF story or recipe example
 * as a phantom duplicate component. None of them defines a component.
 */
const NOT_A_COMPONENT_FILE = /\.(stories|story|test|spec|recipe)\.[jt]sx?$/;

/** Splits on commas and newlines outside `[…]`, `(…)`, `{…}` and quotes, so `import('x'){A, B}` and `[a="b, c"]` stay whole. */
function splitDeclarations(raw: string): string[] {
  const declarations: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | undefined;
  for (const char of raw) {
    if (quote) {
      if (char === quote) quote = undefined;
    } else if (char === '"' || char === "'") quote = char;
    else if ('[({'.includes(char)) depth++;
    else if (')]}'.includes(char)) depth--;
    else if (depth === 0 && (char === ',' || char === '\n')) {
      declarations.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  return [...declarations, current];
}

/**
 * What a component declares as an invalid stand-in for itself, via an
 * `@invalidAlternative` JSDoc tag (`@invalidAlternative button` or a
 * comma-separated list): a native element or another component it supersedes.
 *
 * Case is preserved: `MuiButton` is a component, `button` an element. Each
 * declaration is kept whole (a selector such as `Input[type="password"]` or a
 * package as `import('@radix-ui/react-tabs')`) and parsed by the JSX check.
 * Commas inside `[...]`, `(...)` or `{...}` don't split.
 */
function declaredInvalidAlternatives(doc: ComponentDoc): string[] {
  const tags = doc.tags ?? {};
  if (!('invalidAlternative' in tags)) return [];
  // TypeScript reads a scoped package outside `import('…')`
  // (`@radix-ui/react-tabs`) as tag `radix-ui` with text `/react-tabs, …`;
  // rejoining lets the check report it.
  const splitOff = Object.entries(tags)
    .filter(([name, text]) => name !== 'invalidAlternative' && text.startsWith('/'))
    .map(([name, text]) => `@${name}${text}`);
  return [tags.invalidAlternative ?? '', ...splitOff]
    .flatMap(splitDeclarations)
    .map((declaration) => declaration.trim().replace(/[<>`]/g, ''))
    .filter(Boolean);
}

/** A `!`-prefixed glob excludes files the other globs include. */
const isExclusion = (pattern: string) => pattern.startsWith('!');

function globFiles(configDir: string, pattern: string): string[] {
  return globSync(isAbsolute(pattern) ? pattern : resolve(configDir, pattern));
}

/**
 * The folder a glob starts from — its segments before the first wildcard,
 * so `packages/ui/src/*\/index.tsx` gives `packages/ui/src`.
 */
function globRoot(configDir: string, pattern: string): string {
  const segments = pattern.split('/');
  const wildcard = segments.findIndex((segment) => /[*?[{]/.test(segment));
  return resolve(configDir, segments.slice(0, wildcard === -1 ? -1 : wildcard).join('/'));
}

/** The folders the component globs read from; everything under them is design-system code. */
export function componentRoots(patterns: string[], configDir: string): string[] {
  return patterns.filter((pattern) => !isExclusion(pattern)).map((pattern) => globRoot(configDir, pattern));
}

/** One TypeScript program per tsconfig: docgen reads components from it, and it tells a type export from a value. */
function programFor(tsconfig: string | undefined, files: string[]): ts.Program {
  if (!tsconfig) return ts.createProgram(files, { jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true });
  const { config } = ts.readConfigFile(tsconfig, ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, dirname(tsconfig), {}, tsconfig);
  return ts.createProgram(files, options);
}

/** A doc for an export with no runtime value, like `export type { ButtonProps }`, which docgen reads when it has a JSDoc. */
function isTypeOnly(doc: ComponentDoc, checker: ts.TypeChecker): boolean {
  const symbol = doc.rootExpression;
  if (!symbol) return false;
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  return !(target.flags & ts.SymbolFlags.Value);
}

/** An export marked `@internal`: the code may import it, the inventory leaves it out. */
const isInternal = (doc: ComponentDoc) => 'internal' in (doc.tags ?? {});

/**
 * `filePath` is passed in: react-docgen-typescript trims `doc.filePath`,
 * breaking sibling lookups like a component's recipe.
 */
function toContract(doc: ComponentDoc, filePath: string): ComponentContract {
  const props = toProps(doc.props);

  return {
    name: doc.displayName,
    category: basename(dirname(filePath)),
    description: doc.description,
    props,
    variantProps: props.filter((p) => p.allowedValues).map((p) => p.name),
    invalidAlternatives: declaredInvalidAlternatives(doc),
    filePath,
  };
}

/**
 * Reads React component contracts via the TypeScript type checker
 * (`react-docgen-typescript`, as Storybook's autodocs does): props, required
 * flags, and a variant prop's actual allowed values even when typed as
 * `keyof typeof someObject`.
 *
 * `patterns` are `node:fs` `globSync` globs; a `!`-prefixed one excludes. Each
 * glob is read with the `tsconfig.json` nearest its folder, for path aliases
 * like a monorepo's `@app/*`; without one, only relative/`node_modules`
 * imports resolve.
 */
export function loadComponents(patterns: string[], configDir: string): ComponentContract[] {
  const excluded = new Set(
    patterns.filter(isExclusion).flatMap((pattern) => globFiles(configDir, pattern.slice(1))),
  );
  const filesByTsconfig = new Map<string | undefined, Set<string>>();
  for (const pattern of patterns.filter((pattern) => !isExclusion(pattern))) {
    const tsconfig = ts.findConfigFile(globRoot(configDir, pattern), ts.sys.fileExists);
    const files = filesByTsconfig.get(tsconfig) ?? new Set<string>();
    filesByTsconfig.set(tsconfig, files);
    for (const file of globFiles(configDir, pattern)) {
      if (!NOT_A_COMPONENT_FILE.test(file) && !excluded.has(file)) files.add(file);
    }
  }

  const contracts: ComponentContract[] = [];
  const seen = new Set<string>();
  for (const [tsconfig, fileSet] of filesByTsconfig) {
    const files = [...fileSet];
    // Build one TypeScript program per tsconfig, not one per file in the component inventory.
    const program = programFor(tsconfig, files);
    const parser = withCompilerOptions(program.getCompilerOptions(), {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      shouldIncludeExpression: true,
    });
    for (const doc of parser.parseWithProgramProvider(files, () => program)) {
      if (isTypeOnly(doc, program.getTypeChecker()) || isInternal(doc)) continue;
      const file =
        files.find((candidate) => candidate === resolve(doc.filePath)) ??
        files.find((candidate) => candidate.endsWith(doc.filePath));
      if (file && !seen.has(doc.displayName)) {
        contracts.push(toContract(doc, file));
        seen.add(doc.displayName);
      }
    }
  }
  return contracts;
}
