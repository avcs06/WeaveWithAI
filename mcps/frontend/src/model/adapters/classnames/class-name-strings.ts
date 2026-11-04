import type { Expression } from '@babel/types';

/**
 * Collects every string a `className` could hold (a plain string, a template
 * literal, or arguments to a `classNames(...)`/`clsx(...)`-style helper)
 * without knowing which helper is used. Knows nothing about any className
 * convention; callers interpret the result.
 */
export function collectClassNameStrings(node: Expression, out: string[]): void {
  if (node.type === 'StringLiteral') {
    out.push(node.value);
  } else if (node.type === 'TemplateLiteral') {
    for (const quasi of node.quasis) out.push(quasi.value.raw);
  } else if (node.type === 'CallExpression') {
    for (const arg of node.arguments) {
      if (arg.type !== 'SpreadElement' && arg.type !== 'ArgumentPlaceholder') {
        collectClassNameStrings(arg, out);
      }
    }
  } else if (node.type === 'ArrayExpression') {
    for (const el of node.elements) {
      if (el && el.type !== 'SpreadElement') collectClassNameStrings(el, out);
    }
  } else if (node.type === 'ObjectExpression') {
    // `clsx({ flex: isRow })`: the key is the class, present under some
    // condition.
    for (const prop of node.properties) {
      if (prop.type !== 'ObjectProperty' || prop.computed) continue;
      if (prop.key.type === 'Identifier') out.push(prop.key.name);
      else if (prop.key.type === 'StringLiteral') out.push(prop.key.value);
    }
  } else if (node.type === 'ConditionalExpression') {
    collectClassNameStrings(node.consequent, out);
    collectClassNameStrings(node.alternate, out);
  } else if (node.type === 'LogicalExpression') {
    collectClassNameStrings(node.left, out);
    collectClassNameStrings(node.right, out);
  }
}

/** The individual class names an element carries, across every string the value could produce. */
export function classNameTokens(node: Expression): Set<string> {
  const strings: string[] = [];
  collectClassNameStrings(node, strings);
  const tokens = new Set<string>();
  for (const str of strings) {
    for (const token of str.split(/\s+/)) {
      if (token) tokens.add(token);
    }
  }
  return tokens;
}
