import { existsSync, globSync, readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';

import { loadTokens } from './adapters/styles-adapter.js';
import { recipeDefaults } from './adapters/styles/recipe-defaults.js';
import { componentRoots, loadComponents, loadPackageComponents } from './adapters/components-adapter.js';
import { loadRecipes, recipeImporting, type RecipeFile } from './adapters/recipes-adapter.js';
import { buildInvalidAlternativeOwners } from './adapters/tsx-adapter.js';
import type { ResolvedConfig } from './config.js';
import { buildReverseIndex } from './reverse-index.js';
import type { ComponentContract, DesignSystem, DesignToken, GenericAlternative, Recipe, SearchHit } from './types.js';
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
    ...loadComponents(config.components, config.configDir).map(withRecipeDefaults),
    ...(config.packages ?? []).flatMap((pkg) => loadPackageComponents(pkg, config.configDir)),
  ];
}

/** The config's file of invalid alternatives no one component owns; an entry without both fields fails the load, named. */
function loadGenericAlternatives(config: ResolvedConfig): GenericAlternative[] {
  if (!config.invalidAlternatives) return [];
  const file = resolve(config.configDir, config.invalidAlternatives);
  const entries: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(entries)) throw new Error(`${file}: expected a list of { selector, use } entries`);
  return entries.map((entry, index) => {
    const { selector, use } = (entry ?? {}) as Partial<GenericAlternative>;
    if (typeof selector !== 'string' || !selector.trim() || typeof use !== 'string' || !use.trim())
      throw new Error(`${file}: entry ${index + 1} needs a "selector" and a "use", what to use instead`);
    return { selector: selector.trim(), use: use.trim() };
  });
}

/**
 * A component's variant defaults from its styles recipe, `<Name>.recipes.css.ts`
 * beside it with `<name>Recipe`, where the theme sets them; a default the props
 * declare themselves wins.
 */
function withRecipeDefaults(component: ComponentContract): ComponentContract {
  if (!component.filePath) return component;
  const file = join(dirname(component.filePath), `${component.name}.recipes.css.ts`);
  const name = `${component.name.charAt(0).toLowerCase()}${component.name.slice(1)}Recipe`;
  const recipe = existsSync(file) ? recipeDefaults(file, name) : undefined;
  if (!recipe) return component;
  return {
    ...component,
    props: component.props.map((prop) =>
      prop.default === undefined && recipe.defaults[prop.name] !== undefined
        ? { ...prop, default: recipe.defaults[prop.name] }
        : prop,
    ),
    looks: recipe.variants.filter((variant) => variant.name !== 'variant' && variant.name !== 'size'),
  };
}

/**
 * Ranks a match: exact name, then prefix, substring, then a mention in the
 * surrounding text. Zero means no match.
 */
function scoreMatch(query: string, name: string, haystack: string): number {
  const n = name.toLowerCase();
  if (n === query) return 100;
  if (n.startsWith(query)) return 75;
  if (n.includes(query)) return 50;
  if (haystack.toLowerCase().includes(query)) return 25;
  return 0;
}

/** Text with only letters and digits, so `DropdownMenu` finds `dropdown-menu`. */
const compact = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

function rank(hits: SearchHit[], limit: number): SearchHit[] {
  return hits
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/**
 * Builds the `DesignSystem` lookup API from a resolved config. Token sources
 * are concatenated; merging same-named tokens across them is up to whoever
 * configures the paths.
 */
export function createDesignSystem(config: ResolvedConfig): DesignSystem {
  const tokenClass = config.tailwind?.tokenClass;
  const tokens = loadAllTokens(config).map((token) => {
    const className = tokenClass?.(token);
    return className ? { ...token, className } : token;
  });
  const components = loadAllComponents(config);
  const reverseIndex = buildReverseIndex(tokens);
  // A map: a source can be a whole icon package and `validate` looks up a name
  // per JSX tag.
  const byName = new Map(components.map((c) => [c.name.toLowerCase(), c]));
  const byExactName = new Map(components.map((c) => [c.name, c]));
  const invalidAlternatives = buildInvalidAlternativeOwners(components, loadGenericAlternatives(config));
  const designSystemRoots = config.designSystemFolders
    ? config.designSystemFolders.map((folder) => resolve(config.configDir, folder))
    : componentRoots(config.components, config.configDir);
  const recipeFiles = loadRecipes(config.recipes ?? [], config.configDir);
  const recipePaths = new Set(recipeFiles.map((recipe) => recipe.filePath));
  const importExceptionPaths = new Set(
    (config.importExceptions ?? []).flatMap((pattern) =>
      globSync(isAbsolute(pattern) ? pattern : resolve(config.configDir, pattern)),
    ),
  );

  // A recipe covers components declared beside it in a file of its name
  // (`Button.tsx`) or the folder's barrel.
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
        invalidAlternatives: c.invalidAlternatives,
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
        components.map((component) => {
          // What a component supersedes is what an agent searches for: "combobox", "DropdownMenu", "spinner".
          const alternatives = component.invalidAlternatives.join(' ');
          return {
            kind: 'component' as const,
            name: component.name,
            description: component.description,
            ...(component.invalidAlternatives.length && {
              invalidAlternatives: component.invalidAlternatives,
            }),
            score: scoreMatch(
              needle,
              component.name,
              `${component.description} ${component.category} ${component.props.map((p) => p.name).join(' ')} ${alternatives} ${compact(alternatives)}`,
            ),
          };
        }),
        limit,
      );
    },

    recipe(name) {
      const needle = name.trim().toLowerCase();
      const component = system.component(name);
      const file =
        recipeFiles.find((recipe) => recipe.name.toLowerCase() === needle) ??
        (component && recipeFiles.find((recipe) => covers(recipe, component))) ??
        recipeImporting(recipeFiles, name);
      return file && toRecipe(file);
    },

    recipes() {
      return recipeFiles.map((recipe) => recipe.name);
    },

    diagnostics() {
      return invalidAlternatives.diagnostics;
    },

    validate(code, filename) {
      return runValidate(system, code, filename, {
        tailwind: config.tailwind ?? {},
        designSystemRoots,
        recipeFiles: recipePaths,
        importExceptions: importExceptionPaths,
        configDir: config.configDir,
        invalidAlternatives,
      });
    },
  };

  return system;
}
