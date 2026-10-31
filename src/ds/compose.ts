import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const RECIPES = 'packages/ui/src/*/*.recipe.tsx';

/** `Tabs` to `Tab`, `RadioGroup` to `Radio`, `MultiSelect` to `Select`. */
const stem = (name: string) =>
  name.replace(/^Multi/, '').replace(/Group$/, '').replace(/s$/, '');

/**
 * A child that belongs to its parent by name: a member (`Accordion.Item`) or
 * the parent's stem followed by nothing or a capital (`Tab`, `SelectOption`),
 * never a lookalike (`Table` in a `Tab`).
 */
function belongs(parent: string, child: string): boolean {
  if (child === parent) return false;
  if (child.startsWith(`${parent}.`)) return true;
  const base = stem(parent);
  if (!child.startsWith(base)) return false;
  const rest = child.slice(base.length);
  return rest === '' || /^[A-Z]/.test(rest);
}

/** The component a JSX tag names, through `const X = createTable()` aliases. */
function tagName(
  tag: ts.JsxTagNameExpression,
  names: Set<string>,
  aliases: Map<string, string>,
): string | undefined {
  if (ts.isIdentifier(tag)) {
    const name = aliases.get(tag.text) ?? tag.text;
    return names.has(name) ? name : undefined;
  }
  if (ts.isPropertyAccessExpression(tag) && ts.isIdentifier(tag.expression)) {
    const owner = aliases.get(tag.expression.text) ?? tag.expression.text;
    return names.has(owner) ? `${owner}.${tag.name.text}` : undefined;
  }
  return undefined;
}

function tableAliases(source: ts.SourceFile): Map<string, string> {
  const aliases = new Map<string, string>();
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === 'createTable'
    )
      aliases.set(node.name.text, 'Table');
    ts.forEachChild(node, visit);
  };
  visit(source);
  return aliases;
}

/**
 * What each component contains, read from the recipes: the components nested
 * directly under it in their JSX, children and props alike, kept when they
 * belong to it by name. Sorted; a component that contains nothing is absent.
 */
export function composition(
  templateDir: string,
  componentNames: string[],
): Record<string, string[]> {
  const names = new Set(componentNames);
  const found = new Map<string, Set<string>>();
  for (const file of globSync(RECIPES, { cwd: templateDir }).sort()) {
    const source = ts.createSourceFile(
      file,
      readFileSync(path.join(templateDir, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const aliases = tableAliases(source);
    const visit = (node: ts.Node, parent: string | undefined) => {
      let next = parent;
      const opening = ts.isJsxElement(node)
        ? node.openingElement
        : ts.isJsxSelfClosingElement(node)
          ? node
          : undefined;
      if (opening) {
        const name = tagName(opening.tagName, names, aliases);
        if (name) {
          if (parent && belongs(parent, name)) {
            if (!found.has(parent)) found.set(parent, new Set());
            found.get(parent)?.add(name);
          }
          next = name;
        }
      }
      ts.forEachChild(node, (child) => visit(child, next));
    };
    visit(source, undefined);
  }
  return Object.fromEntries(
    [...found].map(([parent, children]) => [parent, [...children].sort()]),
  );
}
