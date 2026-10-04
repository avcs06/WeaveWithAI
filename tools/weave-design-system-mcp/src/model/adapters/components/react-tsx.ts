import { globSync } from 'node:fs';
import { basename, dirname, isAbsolute, resolve } from 'node:path';

import { parse, withCustomConfig, type ComponentDoc } from 'react-docgen-typescript';
import ts from 'typescript';

import type { ComponentContract } from '../../types.js';
import { toProps } from './props.js';

/**
 * Stories, tests and recipes sit next to the components they cover, so the
 * natural `components/**\/*.tsx` glob sweeps them up too — and docgen will
 * happily report a CSF story object or a recipe's example as a component,
 * yielding a phantom entry and a duplicate of the real one. None of them
 * ever defines a component.
 */
const NOT_A_COMPONENT_FILE = /\.(stories|story|test|spec|recipe)\.[jt]sx?$/;

/**
 * What a component declares as an invalid stand-in for itself, via an
 * `@invalidAlternative` JSDoc tag (`@invalidAlternative button` or a
 * comma-separated list). Usually a native element the component replaces,
 * but equally another component — a third-party or legacy one the design
 * system's version supersedes.
 *
 * Case is preserved, since `MuiButton` is a component and `button` is an
 * element. Each declaration is kept whole — a selector such as
 * `Input[type="password"]` or a package as `import('@radix-ui/react-tabs')`
 * — and parsed by the JSX check. Commas inside `[...]` or `(...)` don't split.
 */
function declaredInvalidAlternatives(doc: ComponentDoc): string[] {
  const raw = doc.tags?.invalidAlternative;
  if (!raw) return [];
  return raw
    .split(/\n|,(?![^[(]*[\])])/)
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

function parserFor(tsconfig: string | undefined): { parse: (files: string[]) => ComponentDoc[] } {
  const options = { shouldExtractLiteralValuesFromEnum: true, shouldRemoveUndefinedFromOptional: true };
  return tsconfig ? withCustomConfig(tsconfig, options) : { parse: (files) => parse(files, options) };
}

/**
 * `filePath` is passed in rather than read off `doc.filePath`:
 * react-docgen-typescript trims the path it reports for display, which
 * breaks colocated-sibling lookups like finding a recipe next to the
 * component. The path we globbed is the real one.
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
 * (`react-docgen-typescript` — the same tool Storybook's own autodocs use):
 * props, required flags, and — critically — resolves a variant prop's
 * *actual* allowed values even when it's typed as `keyof typeof someObject`
 * rather than a literal union written directly (confirmed against a real
 * component using exactly that pattern).
 *
 * `patterns` are globs (`node:fs`'s built-in `globSync`, no extra
 * dependency); a `!`-prefixed one excludes. Each glob is read with the
 * `tsconfig.json` nearest its folder, for path aliases like a monorepo's
 * `@app/*` — without one, only plain relative/`node_modules` imports resolve.
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
    for (const doc of parserFor(tsconfig).parse(files)) {
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
