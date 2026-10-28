import _traverse from '@babel/traverse';
import type { Node } from '@babel/types';

// @babel/traverse's default export may be CJS-interop-wrapped, depending on
// Node's resolution.
export const traverse = ((_traverse as unknown as { default?: typeof _traverse }).default ??
  _traverse) as typeof _traverse;

/** Where a finding points: a node's 1-based line and column, or 0/0 when it has no location. */
export function position(node: Node): { line: number; column: number } {
  return { line: node.loc ? node.loc.start.line : 0, column: node.loc ? node.loc.start.column + 1 : 0 };
}
