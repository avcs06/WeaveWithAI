import type { Expression, Node, ObjectExpression } from '@babel/types';

import type { DesignToken } from '../../types.js';

function isStringOrNumberLiteral(node: Node): node is Node & { value: string | number } {
  return node.type === 'StringLiteral' || node.type === 'NumericLiteral';
}

/** Strips `as const` / `satisfies X` / `!` wrappers to reach the real expression underneath. */
export function unwrapExpression(node: Expression): Expression {
  while (
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSNonNullExpression'
  ) {
    node = node.expression;
  }
  return node;
}

/**
 * Walks a (possibly nested) object literal, emitting one `DesignToken` per
 * leaf: a string/number literal becomes a token with a resolved `value`; a
 * bare `null` becomes a token with no value (a theme *contract* leaf). Anything
 * else (a computed expression) can't be resolved statically and is skipped.
 * Shared by the styles adapter's two token-reading modes (vanilla-extract and
 * plain object).
 */
export function flattenObjectLiteral(
  obj: ObjectExpression,
  pathSoFar: string[],
  referenceRoot: string,
  tokens: DesignToken[],
): void {
  for (const prop of obj.properties) {
    if (prop.type !== 'ObjectProperty') continue; // skip spreads/methods — not a token leaf
    if (prop.computed) continue;
    const key = prop.key.type === 'Identifier'
      ? prop.key.name
      : prop.key.type === 'NumericLiteral' || prop.key.type === 'StringLiteral'
        ? String(prop.key.value)
        : undefined;
    if (key === undefined) continue;

    const path = [...pathSoFar, key];
    const value = unwrapExpression(prop.value as Expression);

    if (value.type === 'ObjectExpression') {
      flattenObjectLiteral(value, path, referenceRoot, tokens);
      continue;
    }

    const name = path.join('.');
    const reference = tokenReference(referenceRoot, path);
    if (isStringOrNumberLiteral(value)) {
      tokens.push({ name, group: path[0]!, reference, value: String(value.value) });
    } else if (value.type === 'NullLiteral') {
      tokens.push({ name, group: path[0]!, reference });
    }
  }
}

/** Keep numeric/fractional keys valid JavaScript instead of producing tokens.spacing.0.25. */
export function tokenReference(root: string, path: string[]): string {
  return root + path.map((key) =>
    /^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`,
  ).join('');
}
