import { globSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { literal, objectKeys, parse, property, record } from './ast';

export type Defaults = Record<string, string | boolean>;

export type RecipeLooks = {
  /** The export's name, `buttonRecipe`. */
  recipe: string;
  /** The folder under packages/ui/src. */
  folder: string;
  defaults: Defaults;
  /** Every look the `look` prop can spell, the default first; [] without look variants. */
  looks: string[];
  /** Every token a look may contain. */
  tokens: string[];
};

type LookComponent = {
  name: string;
  category: string;
  props: { name: string; description?: string }[];
};

const RECIPES = 'packages/ui/src/*/*.recipes.css.ts';

function product(choices: string[][]): string[][] {
  return choices.reduce<string[][]>(
    (combinations, options) =>
      combinations.flatMap((prefix) =>
        options.map((option) => [...prefix, option]),
      ),
    [[]],
  );
}

/**
 * A `recipe({ variants, defaultVariants })` call. The looks follow
 * `createLook`: every variant but color scheme and size, a boolean one by its
 * name (`!name` turns a default on off), any other by one of its values.
 */
function readRecipe(
  file: string,
  declaration: ts.VariableDeclaration,
): RecipeLooks | undefined {
  const { name, initializer } = declaration;
  if (!ts.isIdentifier(name) || !initializer) return undefined;
  if (!ts.isCallExpression(initializer)) return undefined;
  const callee = initializer.expression;
  if (!ts.isIdentifier(callee) || callee.text !== 'recipe') return undefined;
  const [options] = initializer.arguments;
  if (!options || !ts.isObjectLiteralExpression(options)) return undefined;

  const variantsNode = property(options, 'variants');
  const variants: [string, string[]][] = objectKeys(variantsNode).map(
    (variant) => [variant, objectKeys(property(variantsNode, variant))],
  );
  const defaultsNode = property(options, 'defaultVariants');
  const defaults: Defaults = Object.fromEntries(
    Object.entries(
      defaultsNode
        ? record(literal(defaultsNode), `${file} ${name.text}.defaultVariants`)
        : {},
    ).filter(
      (entry): entry is [string, string | boolean] =>
        typeof entry[1] !== 'object',
    ),
  );

  const lookVariants = variants.filter(
    ([variant]) => variant !== 'variant' && variant !== 'size',
  );
  const choices = lookVariants.map(([variant, values]) => {
    const fallback = defaults[variant];
    if (values.includes('true'))
      return fallback === true ? [variant, `!${variant}`] : ['', variant];
    const rest = values.filter((value) => value !== fallback);
    return typeof fallback === 'string' ? [fallback, ...rest] : rest;
  });
  const tokens = lookVariants.flatMap(([variant, values]) =>
    values.includes('true') ? [variant, `!${variant}`] : values,
  );
  const looks = lookVariants.length
    ? product(choices).map((spelling) => spelling.filter(Boolean).join(' '))
    : [];
  return {
    recipe: name.text,
    folder: path.basename(path.dirname(file)),
    defaults,
    looks,
    tokens,
  };
}

/** Every recipe of the ui package's recipes files, in file order. */
export function readRecipes(templateDir: string): RecipeLooks[] {
  const files = globSync(RECIPES, { cwd: templateDir }).sort();
  return files.flatMap((file) =>
    parse(templateDir, file).statements.flatMap((statement) =>
      ts.isVariableStatement(statement)
        ? statement.declarationList.declarations.flatMap(
            (declaration) => readRecipe(file, declaration) ?? [],
          )
        : [],
    ),
  );
}

const lowerFirst = (text: string) =>
  text.charAt(0).toLowerCase() + text.slice(1);

/**
 * The recipe a component's `look` resolves against: the one whose tokens
 * cover every token its description names in backticks, its own folder
 * first, then the one with the fewest tokens.
 */
function lookRecipe(
  recipes: RecipeLooks[],
  component: LookComponent,
): RecipeLooks | undefined {
  const look = component.props.find((prop) => prop.name === 'look');
  if (!look) return undefined;
  const named = [...(look.description ?? '').matchAll(/`([^`]+)`/g)].map(
    (match) => match[1] ?? '',
  );
  const candidates = recipes
    .filter(
      (recipe) =>
        recipe.looks.length &&
        named.every((token) => recipe.tokens.includes(token)),
    )
    .sort(
      (a, b) =>
        Number(b.folder === component.category) -
          Number(a.folder === component.category) ||
        a.tokens.length - b.tokens.length,
    );
  const [best] = candidates;
  if (!best)
    throw new Error(
      `${component.name}: no recipe spells the looks ${named.join(', ')}`,
    );
  return best;
}

/**
 * A component's default variants, from the recipe named after it, and every
 * look its `look` prop accepts.
 */
export function componentLooks(
  recipes: RecipeLooks[],
  component: LookComponent,
): { defaults?: Defaults; looks?: string[] } {
  const own = recipes.find(
    (recipe) => recipe.recipe === `${lowerFirst(component.name)}Recipe`,
  );
  const looks = lookRecipe(recipes, component)?.looks;
  return {
    ...(own && { defaults: own.defaults }),
    ...(looks?.length && { looks }),
  };
}
