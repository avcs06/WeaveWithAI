import { readFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';

import { loadTokens } from './adapters/styles-adapter.js';
import { componentRoots, loadComponents, loadPackageComponents } from './adapters/components-adapter.js';
import { loadRecipes, type RecipeFile } from './adapters/recipes-adapter.js';
import { buildInvalidAlternativeOwners } from './adapters/tsx-adapter.js';
import type { ResolvedConfig } from './config.js';
import { buildReverseIndex } from './reverse-index.js';
import type { ComponentContract, DesignSystem, DesignToken, Recipe, SearchHit } from './types.js';
import { validate as runValidate } from './validate.js';

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) dp[i]![0] = i;
  for (let j = 0; j < cols; j++) dp[0]![j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[rows - 1]![cols - 1]!;
}

function loadAllTokens(config: ResolvedConfig): DesignToken[] {
  return config.tokens.flatMap((path) => loadTokens(resolve(config.configDir, path)));
}

function loadAllComponents(config: ResolvedConfig): ComponentContract[] {
  return [
    ...loadComponents(config.components, config.configDir),
    ...(config.packages ?? []).flatMap((pkg) => loadPackageComponents(pkg, config.configDir)),
  ];
}

/**
 * Ranks a match so an exact name beats a prefix, which beats a substring,
 * which beats a mention anywhere in the surrounding text. Zero means "not a
 * match at all" and is dropped by the callers below.
 */
function scoreMatch(query: string, name: string, haystack: string): number {
  const n = name.toLowerCase();
  if (n === query) return 100;
  if (n.startsWith(query)) return 75;
  if (n.includes(query)) return 50;
  if (haystack.toLowerCase().includes(query)) return 25;
  return 0;
}

function rank(hits: SearchHit[], limit: number): SearchHit[] {
  return hits
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/**
 * Builds the `DesignSystem` lookup API from a resolved config: loads every
 * configured token source (concatenated — merging same-named tokens across
 * sources is left to whoever configures the paths, not solved here), the
 * configured component source, and the reverse index derived from whichever
 * tokens have a resolved value.
 */
export function createDesignSystem(config: ResolvedConfig): DesignSystem {
  const tokenClass = config.tailwind?.tokenClass;
  const tokens = loadAllTokens(config).map((token) => {
    const className = tokenClass?.(token);
    return className ? { ...token, className } : token;
  });
  const components = loadAllComponents(config);
  const reverseIndex = buildReverseIndex(tokens);
  // A component source can be an entire icon package, so `component()` gets
  // a map rather than a linear scan — `validate` looks up a name per JSX tag.
  const byName = new Map(components.map((c) => [c.name.toLowerCase(), c]));
  const byExactName = new Map(components.map((c) => [c.name, c]));
  const invalidAlternatives = buildInvalidAlternativeOwners(components);
  const designSystemRoots = componentRoots(config.components, config.configDir);
  const recipeFiles = loadRecipes(config.recipes ?? [], config.configDir);
  const recipePaths = new Set(recipeFiles.map((recipe) => recipe.filePath));

  // A recipe covers the components declared beside it in a file of its own
  // name (`Button.tsx` for `Button.recipe.tsx`) or in the folder's barrel.
  const covers = (recipe: RecipeFile, component: ComponentContract) =>
    component.filePath !== undefined &&
    dirname(component.filePath) === dirname(recipe.filePath) &&
    [recipe.name, 'index'].includes(basename(component.filePath).replace(/\.[cm]?[jt]sx?$/, ''));

  const toRecipe = (recipe: RecipeFile): Recipe => ({
    name: recipe.name,
    file: relative(config.configDir, recipe.filePath),
    covers: components
      .filter((component) => covers(recipe, component))
      .map((component) => component.name)
      .sort(),
    code: readFileSync(recipe.filePath, 'utf8'),
  });

  const system: DesignSystem = {
    tokens(group) {
      return group ? tokens.filter((t) => t.group === group) : tokens;
    },

    nearestToken(value, group) {
      return reverseIndex.nearestToken(value, group);
    },

    components(category) {
      const filtered = category
        ? components.filter((c) => c.category.toLowerCase() === category.toLowerCase())
        : components;
      return filtered.map((c) => ({
        name: c.name,
        description: c.description,
        category: c.category,
        variantProps: c.variantProps,
      }));
    },

    component(name) {
      return byExactName.get(name.trim()) ?? byName.get(name.trim().toLowerCase());
    },

    closestComponents(name, limit = 5) {
      return components
        .map((c) => ({ name: c.name, distance: levenshtein(name.toLowerCase(), c.name.toLowerCase()) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map((c) => c.name);
    },

    searchTokens(query, limit = 20) {
      const needle = query.trim().toLowerCase();
      if (!needle) return [];
      return rank(
        tokens.map((token) => ({
          kind: 'token' as const,
          name: token.name,
          description: token.reference,
          ...(token.className && { className: token.className }),
          score: scoreMatch(
            needle,
            token.name,
            `${token.group} ${token.reference} ${token.className ?? ''} ${token.value ?? ''}`,
          ),
        })),
        limit,
      );
    },

    searchComponents(query, limit = 20) {
      const needle = query.trim().toLowerCase();
      if (!needle) return [];
      return rank(
        components.map((component) => ({
          kind: 'component' as const,
          name: component.name,
          description: component.description,
          score: scoreMatch(
            needle,
            component.name,
            `${component.description} ${component.category} ${component.props.map((p) => p.name).join(' ')}`,
          ),
        })),
        limit,
      );
    },

    recipe(name) {
      const needle = name.trim().toLowerCase();
      const component = system.component(name);
      const file =
        recipeFiles.find((recipe) => recipe.name.toLowerCase() === needle) ??
        (component && recipeFiles.find((recipe) => covers(recipe, component)));
      return file && toRecipe(file);
    },

    recipes() {
      return recipeFiles.map((recipe) => recipe.name);
    },

    validate(code, filename) {
      return runValidate(system, code, filename, {
        vanillaExtract: config.vanillaExtract ?? {},
        tailwind: config.tailwind ?? {},
        designSystemRoots,
        recipeFiles: recipePaths,
        configDir: config.configDir,
        invalidAlternatives,
      });
    },
  };

  return system;
}
