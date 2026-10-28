import { relative, resolve } from 'node:path';

import { parse } from '@babel/parser';

import { validateStyles } from './adapters/styles-adapter.js';
import { validateJsx, type InvalidAlternativeOwners } from './adapters/tsx-adapter.js';
import type { DesignSystem, Finding, TailwindPolicy, ValidateResult, VanillaExtractPolicy } from './types.js';

interface ValidateContext {
  vanillaExtract: VanillaExtractPolicy;
  tailwind: TailwindPolicy;
  /** Folders holding the design system's own source; a file inside one gets the design-system rules. */
  designSystemRoots: string[];
  /** Recipe files: inside those folders, but app code. */
  recipeFiles: ReadonlySet<string>;
  /** Files the import rule skips, from the config's `importExceptions`. */
  importExceptions: ReadonlySet<string>;
  /** Directory a relative `filename` resolves against. */
  configDir: string;
  /** Prebuilt tag lookup, owned by the design system so it isn't rebuilt per call. */
  invalidAlternatives: InvalidAlternativeOwners;
}

function isDesignSystemFile(filePath: string | undefined, context: ValidateContext): boolean {
  return Boolean(filePath && context.designSystemRoots.some((root) => !relative(root, filePath).startsWith('..')));
}

/**
 * Parses `code` (JSX/TSX or `.css.ts`) once, then runs the styles adapter on
 * style-defining calls and the TSX adapter on JSX elements (which hands
 * `className` to the className adapter). Never throws: unparseable code becomes
 * a `parse-error` finding.
 */
export function validate(
  system: DesignSystem,
  code: string,
  filename: string | undefined,
  context: ValidateContext,
): ValidateResult {
  const filePath = filename ? resolve(context.configDir, filename) : undefined;
  // Recipes are app code: app rules, and no use of what their component
  // supersedes.
  const recipe = filePath !== undefined && context.recipeFiles.has(filePath);
  // In a .ts file `<T>(x: T) => x` is a generic, not a JSX tag.
  const jsx = !filePath || !/\.[cm]?ts$/.test(filePath);
  let findings: Finding[];
  try {
    const ast = parse(code, { sourceType: 'module', plugins: jsx ? ['typescript', 'jsx'] : ['typescript'] });
    findings = [
      ...validateStyles(ast, system, context.vanillaExtract),
      ...validateJsx(ast, system, context.tailwind, context.invalidAlternatives, {
        designSystem: !recipe && isDesignSystemFile(filePath, context),
        importException: filePath !== undefined && context.importExceptions.has(filePath),
        filePath: recipe ? undefined : filePath,
      }),
    ];
  } catch (error) {
    findings = [
      {
        rule: 'parse-error',
        severity: 'error',
        surface: 'jsx',
        line: 1,
        column: 1,
        message: `Could not parse this as ${jsx ? 'TSX' : 'TypeScript'}: ${(error as Error).message}${filename ? ` (${filename})` : ''}`,
      },
    ];
  }

  return { ok: findings.every((f) => f.severity !== 'error'), findings };
}
