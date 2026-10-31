import type { Binding, NodePath, Scope } from '@babel/traverse';
import type { Identifier, MemberExpression, Node, StringLiteral } from '@babel/types';

/** One export a file reaches by name — `default` for a default export — and where it does. */
export interface ModuleUse {
  name: string;
  node: Node;
}

/** One place a file brings in a module at runtime: an import, a re-export, `require()` or `import()`. */
export interface ModuleReference {
  node: Node;
  source: string;
  /** The exports it names, where it renders them, and where it reads them off the module object. */
  uses: ModuleUse[];
}

const nameOf = (node: Identifier | StringLiteral) => (node.type === 'Identifier' ? node.name : node.value);

function propertyName(member: MemberExpression): string | undefined {
  if (!member.computed && member.property.type === 'Identifier') return member.property.name;
  return member.property.type === 'StringLiteral' ? member.property.value : undefined;
}

/** A `require()`/`import()` argument written as a literal. */
function literalSource(node: Node | undefined): string | undefined {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0)
    return node.quasis[0]?.value.cooked ?? undefined;
  return undefined;
}

/** The opening element a JSX name sits in: `<X>`, or the root of `<X.Part>`. Closing tags don't count. */
function openingElement(reference: NodePath): Node | undefined {
  let path: NodePath | null = reference;
  while (path.parentPath?.isJSXMemberExpression()) path = path.parentPath;
  return path.parentPath?.isJSXOpeningElement() ? path.parent : undefined;
}

/** Each element rendering a binding of one export. */
function renderedBy(binding: Binding | undefined, name: string): ModuleUse[] {
  return (binding?.referencePaths ?? []).flatMap((reference) => {
    const element = openingElement(reference);
    return element ? [{ name, node: element }] : [];
  });
}

/** The exports read off a binding of the whole module: `M.A`, and `<M.A>` pointing at its element. */
function membersOf(binding: Binding | undefined): ModuleUse[] {
  return (binding?.referencePaths ?? []).flatMap((reference): ModuleUse[] => {
    const { parent } = reference;
    if (parent.type === 'MemberExpression' && parent.object === reference.node) {
      const name = propertyName(parent);
      return name ? [{ name, node: parent }] : [];
    }
    if (parent.type === 'JSXMemberExpression' && parent.object === reference.node)
      return [{ name: parent.property.name, node: openingElement(reference) ?? parent }];
    return [];
  });
}

/** What a pattern bound to the whole module uses: `M` through `M.A`, `{ A }` by name and wherever it renders `A`. */
function patternUses(pattern: NodePath, scope: Scope): ModuleUse[] {
  const { node } = pattern;
  if (node.type === 'Identifier') return membersOf(scope.getBinding(node.name));
  if (node.type !== 'ObjectPattern') return [];
  return node.properties.flatMap((property) => {
    if (property.type !== 'ObjectProperty' || property.computed) return [];
    if (property.key.type !== 'Identifier' && property.key.type !== 'StringLiteral') return [];
    const name = nameOf(property.key);
    const local = property.value.type === 'Identifier' ? scope.getBinding(property.value.name) : undefined;
    return [{ name, node: property }, ...renderedBy(local, name)];
  });
}

/** What a `require()` or `import()` uses, read off where its result goes: a declaration, a member, or `.then()`'s callback. */
function dynamicUses(call: NodePath): ModuleUse[] {
  const result = call.parentPath?.isAwaitExpression() ? call.parentPath : call;
  const parent = result.parentPath;
  if (parent?.isVariableDeclarator() && parent.node.init === result.node)
    return patternUses(parent.get('id'), parent.scope);
  if (!parent?.isMemberExpression() || parent.node.object !== result.node) return [];

  const name = propertyName(parent.node);
  if (name !== 'then') return name ? [{ name, node: parent.node }] : [];
  const then = parent.parentPath;
  if (!then?.isCallExpression() || then.node.callee !== parent.node) return [];
  const callback = then.get('arguments')[0];
  const param = callback?.isFunction() ? callback.get('params')[0] : undefined;
  return param && callback ? patternUses(param, callback.scope) : [];
}

/**
 * The module a node brings in at runtime, with the exports it uses, or
 * `undefined` for any other node and for a type-only import or re-export,
 * which never reaches runtime. Only a literal source counts:
 * `import(name)` can't be resolved statically.
 */
export function moduleReference(path: NodePath): ModuleReference | undefined {
  const { node } = path;

  if (node.type === 'ImportDeclaration') {
    if (node.importKind === 'type' || node.importKind === 'typeof') return undefined;
    const specifiers = node.specifiers.filter(
      (specifier) =>
        specifier.type !== 'ImportSpecifier' ||
        (specifier.importKind !== 'type' && specifier.importKind !== 'typeof'),
    );
    if (node.specifiers.length > 0 && specifiers.length === 0) return undefined;

    const uses = specifiers.flatMap((specifier) => {
      const binding = path.scope.getBinding(specifier.local.name);
      if (specifier.type === 'ImportNamespaceSpecifier') return membersOf(binding);
      const name = specifier.type === 'ImportDefaultSpecifier' ? 'default' : nameOf(specifier.imported);
      return [{ name, node: specifier }, ...renderedBy(binding, name)];
    });
    return { node, source: node.source.value, uses };
  }

  if (node.type === 'ExportAllDeclaration' || node.type === 'ExportNamedDeclaration') {
    if (!node.source || node.exportKind === 'type') return undefined;
    const specifiers =
      node.type === 'ExportNamedDeclaration'
        ? node.specifiers.filter(
            (specifier) => specifier.type !== 'ExportSpecifier' || specifier.exportKind !== 'type',
          )
        : [];
    if (node.type === 'ExportNamedDeclaration' && node.specifiers.length > 0 && specifiers.length === 0)
      return undefined;

    const uses = specifiers.flatMap((specifier) =>
      specifier.type === 'ExportSpecifier' ? [{ name: nameOf(specifier.local), node: specifier }] : [],
    );
    return { node, source: node.source.value, uses };
  }

  const isRequire =
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    !path.scope.hasBinding('require');
  if (node.type !== 'ImportExpression' && !isRequire) return undefined;
  const source = literalSource(node.type === 'ImportExpression' ? node.source : node.arguments[0]);
  return source === undefined ? undefined : { node, source, uses: dynamicUses(path) };
}
