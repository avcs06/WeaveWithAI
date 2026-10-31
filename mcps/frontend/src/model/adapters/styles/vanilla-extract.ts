import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

import { parse } from '@babel/parser';
import type { File, ObjectExpression } from '@babel/types';

import type { DesignToken } from '../../types.js';
import { traverse } from '../ast.js';
import { flattenObjectLiteral } from './flatten-object-literal.js';

const THEME_DEFINITION_PACKAGE = '@vanilla-extract/css';
const THEME_DEFINITION_CALLS = new Set(['createThemeContract', 'createGlobalTheme']);

function parseTokenFile(filePath: string): File {
  return parse(readFileSync(filePath, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] });
}

/** Is this token file a vanilla-extract theme — does it import a theme-defining call? JSON never is. */
export function isThemeFile(filePath: string): boolean {
  if (extname(filePath) === '.json') return false;
  return parseTokenFile(filePath).program.body.some(
    (node) =>
      node.type === 'ImportDeclaration' &&
      node.source.value === THEME_DEFINITION_PACKAGE &&
      node.specifiers.some(
        (specifier) =>
          specifier.type === 'ImportSpecifier' &&
          specifier.imported.type === 'Identifier' &&
          THEME_DEFINITION_CALLS.has(specifier.imported.name),
      ),
  );
}

/**
 * Reads a vanilla-extract theme file and flattens `createThemeContract` /
 * `createGlobalTheme` calls into a token list. Static: parses with Babel and
 * never executes the file. A theme *contract* declares only shape, so its
 * tokens have a `reference` but no `value`; `createGlobalTheme` usually
 * inlines values, so its tokens get both.
 *
 * Tokens are referenced by the theme's local binding name, e.g. `vars` in
 * `vars.color.theme.background`; wrong if something re-exports or renames it.
 */
export function loadTokens(filePath: string): DesignToken[] {
  const ast = parseTokenFile(filePath);

  const importedNames = new Set<string>();
  const tokens: DesignToken[] = [];

  traverse(ast, {
    ImportDeclaration(nodePath) {
      if (nodePath.node.source.value !== THEME_DEFINITION_PACKAGE) return;
      for (const specifier of nodePath.node.specifiers) {
        // Track the *local* binding, so `import { createGlobalTheme as t }`
        // resolves; the imported name decides whether the specifier is ours.
        if (
          specifier.type === 'ImportSpecifier' &&
          specifier.imported.type === 'Identifier' &&
          THEME_DEFINITION_CALLS.has(specifier.imported.name)
        ) {
          importedNames.add(specifier.local.name);
        }
      }
    },
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;
      if (callee.type !== 'Identifier' || !importedNames.has(callee.name)) return;

      // The shape/value object is the last argument of both createThemeContract
      // and createGlobalTheme.
      const lastArg = nodePath.node.arguments[nodePath.node.arguments.length - 1];
      if (!lastArg || lastArg.type !== 'ObjectExpression') return;

      const declarator = nodePath.parentPath.node;
      const boundName =
        declarator.type === 'VariableDeclarator' && declarator.id.type === 'Identifier'
          ? declarator.id.name
          : undefined;
      if (!boundName) return; // not bound to a simple identifier — nothing to reference it by

      flattenObjectLiteral(lastArg, [], boundName, tokens);
    },
  });

  return tokens;
}

const STYLE_DEFINITION_PACKAGES = new Set(['@vanilla-extract/css', '@vanilla-extract/recipes']);
const STYLE_DEFINITION_CALLS = new Set(['style', 'styleVariants', 'recipe']);

/**
 * The style object of every `style()`/`styleVariants()` call (from
 * `@vanilla-extract/css`) and `recipe()` call (from the separate
 * `@vanilla-extract/recipes` package, tracked explicitly) imported from a
 * vanilla-extract package. This is where token violations live in a system
 * that splits styling between vanilla-extract and Tailwind.
 */
export function styleObjects(ast: File): ObjectExpression[] {
  const importedNames = new Set<string>();
  const objects: ObjectExpression[] = [];

  traverse(ast, {
    ImportDeclaration(nodePath) {
      if (!STYLE_DEFINITION_PACKAGES.has(nodePath.node.source.value)) return;
      for (const specifier of nodePath.node.specifiers) {
        // Track the *local* binding, as in `loadTokens` above.
        if (
          specifier.type === 'ImportSpecifier' &&
          specifier.imported.type === 'Identifier' &&
          STYLE_DEFINITION_CALLS.has(specifier.imported.name)
        ) {
          importedNames.add(specifier.local.name);
        }
      }
    },
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;
      if (callee.type !== 'Identifier' || !importedNames.has(callee.name)) return;

      const arg = nodePath.node.arguments[0];
      if (arg?.type === 'ObjectExpression') objects.push(arg);
    },
  });

  return objects;
}
