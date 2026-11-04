import { readFileSync } from 'node:fs';

import { parse } from '@babel/parser';
import type { Expression, ObjectExpression, ObjectProperty } from '@babel/types';

import { traverse } from '../ast.js';

/** One recipe variant: its values (`true` and `false` for an on/off one) and its default. */
export interface RecipeVariant {
  name: string;
  values: string[];
  boolean: boolean;
  default?: string;
}

/** What a vanilla-extract `recipe()` sets when a prop is left out, and its variants. */
export interface RecipeDefaults {
  /** Variant name to its default value, as text (`'default'`, `'sm'`, `'false'`). */
  defaults: Record<string, string>;
  variants: RecipeVariant[];
}

const keyOf = (property: ObjectProperty): string | undefined =>
  property.key.type === 'Identifier'
    ? property.key.name
    : property.key.type === 'StringLiteral'
      ? property.key.value
      : undefined;

function objectProperty(object: ObjectExpression, name: string): Expression | undefined {
  for (const property of object.properties)
    if (property.type === 'ObjectProperty' && !property.computed && keyOf(property) === name)
      return property.value as Expression;
  return undefined;
}

function literal(node: Expression): string | undefined {
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'BooleanLiteral' || node.type === 'NumericLiteral') return String(node.value);
  return undefined;
}

/**
 * Reads the `recipe({...})` bound to `exportName` in a `.css.ts` file. Static:
 * parses with Babel and never runs the file. Undefined when there is no such
 * recipe.
 */
export function recipeDefaults(filePath: string, exportName: string): RecipeDefaults | undefined {
  const ast = parse(readFileSync(filePath, 'utf8'), { sourceType: 'module', plugins: ['typescript'] });
  let found: RecipeDefaults | undefined;
  traverse(ast, {
    VariableDeclarator(nodePath) {
      const { id, init } = nodePath.node;
      if (id.type !== 'Identifier' || id.name !== exportName || init?.type !== 'CallExpression') return;
      const config = init.arguments[0];
      if (config?.type !== 'ObjectExpression') return;
      const defaultsNode = objectProperty(config, 'defaultVariants');
      const defaults: Record<string, string> = {};
      if (defaultsNode?.type === 'ObjectExpression')
        for (const property of defaultsNode.properties) {
          if (property.type !== 'ObjectProperty' || property.computed) continue;
          const key = keyOf(property);
          const value = literal(property.value as Expression);
          if (key && value !== undefined) defaults[key] = value;
        }
      const variantsNode = objectProperty(config, 'variants');
      const variants: RecipeVariant[] = [];
      if (variantsNode?.type === 'ObjectExpression')
        for (const property of variantsNode.properties) {
          if (property.type !== 'ObjectProperty' || property.computed || property.value.type !== 'ObjectExpression') continue;
          const name = keyOf(property);
          if (!name) continue;
          const values = property.value.properties.flatMap((p) => (p.type === 'ObjectProperty' && !p.computed ? [keyOf(p) ?? ''] : []));
          variants.push({ name, values, boolean: values.includes('true'), default: defaults[name] });
        }
      found = { defaults, variants };
    },
  });
  return found;
}
