import type { NodePath } from '@babel/traverse';
import type { Expression, File, JSXOpeningElement, Node } from '@babel/types';

import type { ComponentContract, DesignSystem, Finding, Rule, TailwindPolicy } from '../types.js';
import { traverse } from './ast.js';
import * as classNameAdapter from './classname-adapter.js';
import * as stylesAdapter from './styles-adapter.js';
import { moduleReference, type ModuleReference } from './tsx/modules.js';
import { fieldOutsideController } from './tsx/rules/field-outside-controller.js';
import {
  invalidAlternativeElement,
  invalidAlternativeImport,
  type InvalidAlternativeOwners,
} from './tsx/rules/invalid-alternative.js';
import { manualFormState } from './tsx/rules/manual-form-state.js';
import { unknownVariant } from './tsx/rules/unknown-variant.js';
import { unlinkedControllerField } from './tsx/rules/unlinked-controller-field.js';

export {
  buildInvalidAlternativeOwners,
  type InvalidAlternativeOwners,
} from './tsx/rules/invalid-alternative.js';

/** One prop on an element: the literals it can take, and the node to point a finding at. */
export interface JsxAttribute {
  /** Its string literal, from `prop="x"` or `prop={"x"}`. */
  value: string | undefined;
  /** Every literal it can take: a string, number or boolean as written, an expression-free template, or either branch of a conditional. */
  values: string[];
  /** Whether `values` is all it can take, with no part computed at runtime. */
  complete: boolean;
  node: Node;
}

/** What an element rule sees: one element, named by an identifier (`button`, `Button`) or a member (`Form.Item`). */
export interface JsxElement {
  node: JSXOpeningElement;
  tag: string;
  /** The design-system component the tag names, if any. */
  component?: ComponentContract;
  /** Its props, including the keys of a spread object literal (`{...{ role: 'menu' }}`). */
  attributes: Map<string, JsxAttribute>;
  /** Whether it spreads props that can't be read (`{...props}`), so any attribute may be set. */
  openSpread: boolean;
  /** The classes its `className` could produce, when it has one. */
  classes?: Set<string>;
  owners: InvalidAlternativeOwners;
  designSystem: boolean;
  filePath?: string;
}

/** What a file rule sees: the whole parsed file, for scenarios spanning a component rather than one element. */
export interface JsxFile {
  ast: File;
  designSystem: boolean;
}

/** What an import rule sees: one place the file brings in a module at runtime, with the exports it uses. */
export interface JsxImport extends ModuleReference {
  owners: InvalidAlternativeOwners;
  designSystem: boolean;
  /** A file the config lets import what other components supersede. */
  importException: boolean;
  filePath?: string;
}

/** Each known scenario is one file under `tsx/rules/`, listed in the registry it applies to. */
const fileRules: Rule<JsxFile>[] = [manualFormState, fieldOutsideController, unlinkedControllerField];
const importRules: Rule<JsxImport>[] = [invalidAlternativeImport];
const elementRules: Rule<JsxElement>[] = [invalidAlternativeElement, unknownVariant];

function findAttributeValue(node: JSXOpeningElement, name: string): Expression | undefined {
  for (const attr of node.attributes) {
    if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') continue;
    if (attr.name.name !== name) continue;
    if (attr.value?.type === 'JSXExpressionContainer') {
      return attr.value.expression.type === 'JSXEmptyExpression'
        ? undefined
        : (attr.value.expression as Expression);
    }
    if (attr.value?.type === 'StringLiteral') return attr.value;
  }
  return undefined;
}

/** A variant prop's literal value, from either `prop="x"` or `prop={"x"}`. */
function literalAttrValue(attr: JSXOpeningElement['attributes'][number]): string | undefined {
  if (attr.type !== 'JSXAttribute') return undefined;
  if (attr.value?.type === 'StringLiteral') return attr.value.value;
  if (attr.value?.type === 'JSXExpressionContainer' && attr.value.expression.type === 'StringLiteral') {
    return attr.value.expression.value;
  }
  return undefined;
}

/** The literals an expression can evaluate to, and whether those are all. */
function literals(node: Node): Pick<JsxAttribute, 'values' | 'complete'> {
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return { values: [String(node.value)], complete: true };
    case 'TemplateLiteral':
      return node.expressions.length === 0
        ? { values: [node.quasis[0]?.value.cooked ?? ''], complete: true }
        : { values: [], complete: false };
    case 'ConditionalExpression': {
      const [consequent, alternate] = [literals(node.consequent), literals(node.alternate)];
      return {
        values: [...consequent.values, ...alternate.values],
        complete: consequent.complete && alternate.complete,
      };
    }
    default:
      return { values: [], complete: false };
  }
}

function readAttributes(node: JSXOpeningElement): Pick<JsxElement, 'attributes' | 'openSpread'> {
  const attributes = new Map<string, JsxAttribute>();
  let openSpread = false;
  for (const attr of node.attributes) {
    if (attr.type === 'JSXAttribute') {
      if (attr.name.type !== 'JSXIdentifier') continue;
      const read = !attr.value
        ? { values: ['true'], complete: true }
        : literals(attr.value.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value);
      attributes.set(attr.name.name, { value: literalAttrValue(attr), ...read, node: attr });
      continue;
    }

    // `{...{ role: 'menu' }}` sets its keys as plainly as writing them out; any other spread could set anything.
    if (attr.argument.type !== 'ObjectExpression') {
      openSpread = true;
      continue;
    }
    for (const property of attr.argument.properties) {
      const key =
        property.type !== 'ObjectProperty' || property.computed
          ? undefined
          : property.key.type === 'Identifier'
            ? property.key.name
            : property.key.type === 'StringLiteral'
              ? property.key.value
              : undefined;
      if (key === undefined || property.type !== 'ObjectProperty') openSpread = true;
      else attributes.set(key, { value: undefined, ...literals(property.value), node: property });
    }
  }
  return { attributes, openSpread };
}

/** `Form.Item` for `<Form.Item>`; `undefined` for a namespaced name like `<svg:rect>`. */
function tagName(name: JSXOpeningElement['name']): string | undefined {
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type !== 'JSXMemberExpression') return undefined;
  const object = tagName(name.object);
  return object && `${object}.${name.property.name}`;
}

/**
 * Runs `fileRules` on the whole file, then walks it once: every runtime import, re-export, `require()` and
 * `import()` through `importRules`, every
 * JSX opening tag (self-closing or not — Babel represents both as
 * `JSXOpeningElement`) through `elementRules`. An inline `style` prop goes
 * to the styles adapter (`style={{}}` is a React feature, not tied to any
 * styling system) and `className` to the className adapter — never to a
 * sibling adapter's internals.
 */
export function validateJsx(
  ast: File,
  system: DesignSystem,
  tailwind: TailwindPolicy,
  owners: InvalidAlternativeOwners,
  options: { designSystem?: boolean; importException?: boolean; filePath?: string } = {},
): Finding[] {
  const { designSystem = false, importException = false, filePath } = options;
  const findings: Finding[] = fileRules.flatMap((rule) => rule({ ast, designSystem }));

  const checkModule = (nodePath: NodePath) => {
    const reference = moduleReference(nodePath);
    if (!reference) return;
    const subject: JsxImport = { ...reference, owners, designSystem, importException, filePath };
    findings.push(...importRules.flatMap((rule) => rule(subject)));
  };

  traverse(ast, {
    ImportDeclaration: checkModule,
    ExportNamedDeclaration: checkModule,
    ExportAllDeclaration: checkModule,
    ImportExpression: checkModule,
    CallExpression: checkModule,
    JSXOpeningElement(nodePath) {
      const node = nodePath.node;
      const classNameValue = findAttributeValue(node, 'className');

      const tag = tagName(node.name);
      if (tag) {
        const subject: JsxElement = {
          node,
          tag,
          // A lowercase tag is a native element, never a component.
          component: /^[a-z]/.test(tag) ? undefined : system.component(tag),
          ...readAttributes(node),
          classes: classNameValue ? classNameAdapter.classNameTokens(classNameValue) : undefined,
          owners,
          designSystem,
          filePath,
        };
        findings.push(...elementRules.flatMap((rule) => rule(subject)));
      }

      const styleValue = findAttributeValue(node, 'style');
      if (styleValue?.type === 'ObjectExpression') {
        findings.push(...stylesAdapter.checkStyleObject(styleValue, system, 'jsx'));
      }

      if (classNameValue) {
        findings.push(...classNameAdapter.check(tailwind, classNameValue, designSystem));
      }
    },
  });

  // An element can be both a declared tag and a superseded import's export; one finding says it.
  const reported = new Set<string>();
  return findings.filter((finding) => {
    if (finding.rule !== 'invalid-alternative') return true;
    const at = `${finding.line}:${finding.column}`;
    if (reported.has(at)) return false;
    reported.add(at);
    return true;
  });
}
