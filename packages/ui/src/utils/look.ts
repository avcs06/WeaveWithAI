import type { recipe, RuntimeFn } from '@vanilla-extract/recipes';

// The recipes package doesn't export its VariantGroups type.
type Recipe = RuntimeFn<NonNullable<Parameters<typeof recipe>[0]['variants']>>;

/**
 * What `look` can set: every variant except color scheme and size. Read from
 * the recipe's options: `RecipeVariants` loses its keys here.
 */
type LookVariants<R extends Recipe> = Omit<
  NonNullable<Parameters<R>[0]>,
  'variant' | 'size'
>;

/**
 * Reads a `look` like 'outline !elevated', in any order, into the recipe's
 * variants: a true/false variant by its name (`!name` for false), any other
 * variant by one of its values. Unknown tokens are ignored.
 */
export const createLook = <R extends Recipe>(recipe: R) => {
  const tokens = new Map<string, [variant: string, value: string | boolean]>();

  const add = (token: string, variant: string, value: string | boolean) => {
    if (tokens.has(token)) {
      throw new Error(`Look token "${token}" belongs to two variants`);
    }
    tokens.set(token, [variant, value]);
  };

  for (const [variant, values] of Object.entries(recipe.classNames.variants)) {
    if (variant === 'variant' || variant === 'size') continue;

    if ('true' in values) {
      add(variant, variant, true);
      add(`!${variant}`, variant, false);
    } else {
      for (const value of Object.keys(values)) add(value, variant, value);
    }
  }

  return (look = '') => {
    const variants: Record<string, string | boolean> = {};
    for (const token of look.split(/\s+/)) {
      const entry = tokens.get(token);
      if (entry) variants[entry[0]] = entry[1];
    }
    return variants as LookVariants<R>;
  };
};
