import { readFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export type Literal = string | number | boolean | { [key: string]: Literal };

export function parse(templateDir: string, file: string): ts.SourceFile {
  const text = readFileSync(path.join(templateDir, file), 'utf8');
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
}

export function propertyName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return undefined;
}

/** Strings, numbers, booleans and object literals of them; anything else is left out. */
export function literal(node: ts.Expression): Literal | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (
    ts.isSatisfiesExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isParenthesizedExpression(node)
  )
    return literal(node.expression);
  if (ts.isObjectLiteralExpression(node)) {
    const entries: [string, Literal][] = [];
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const key = propertyName(property.name);
      const value = literal(property.initializer);
      if (key !== undefined && value !== undefined) entries.push([key, value]);
    }
    return Object.fromEntries(entries);
  }
  return undefined;
}

/** The property names of an object literal, whatever their values. */
export function objectKeys(node: ts.Expression | undefined): string[] {
  if (!node || !ts.isObjectLiteralExpression(node)) return [];
  return node.properties.flatMap((property) => {
    if (ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property))
      return propertyName(property.name) ?? [];
    return [];
  });
}

/** The initializer of an object literal's property, by name. */
export function property(
  node: ts.Expression | undefined,
  key: string,
): ts.Expression | undefined {
  if (!node || !ts.isObjectLiteralExpression(node)) return undefined;
  return node.properties.find(
    (candidate): candidate is ts.PropertyAssignment =>
      ts.isPropertyAssignment(candidate) && propertyName(candidate.name) === key,
  )?.initializer;
}

export function topLevelConst(
  source: ts.SourceFile,
  name: string,
): ts.Expression | undefined {
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === name &&
        declaration.initializer
      )
        return declaration.initializer;
    }
  }
  return undefined;
}

export function record(
  value: Literal | undefined,
  what: string,
): Record<string, Literal> {
  if (typeof value !== 'object')
    throw new Error(`${what}: expected an object literal`);
  return value;
}

export function string(value: Literal | undefined, what: string): string {
  if (typeof value !== 'string') throw new Error(`${what}: expected a string`);
  return value;
}

/** The object literal a file's top-level `const <name>` holds. */
export function constLiteral(
  templateDir: string,
  file: string,
  name: string,
): Record<string, Literal> {
  const initializer = topLevelConst(parse(templateDir, file), name);
  return record(initializer && literal(initializer), `${file} ${name}`);
}
