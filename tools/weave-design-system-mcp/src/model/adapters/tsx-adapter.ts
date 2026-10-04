import type { Expression, File, ImportDeclaration, JSXAttribute, JSXOpeningElement } from '@babel/types';

import type { ComponentContract, DesignSystem, Finding, Rule, TailwindPolicy } from '../types.js';
import { traverse } from './ast.js';
import * as classNameAdapter from './classname-adapter.js';
import * as stylesAdapter from './styles-adapter.js';
import { fieldOutsideController } from './tsx/rules/field-outside-controller.js';
import {
  invalidAlternativeElement,
  invalidAlternativeImport,
  type InvalidAlternativeOwners,
} from './tsx/rules/invalid-alternative.js';
import { manualFormState } from './tsx/rules/manual-form-state.js';
import { unknownVariant } from './tsx/rules/unknown-variant.js';
import { unlinkedControllerField } from './tsx/rules/unlinked-controller-field.js';

export { buildInvalidAlternativeOwners, type InvalidAlternativeOwners } from './tsx/rules/invalid-alternative.js';

/** One prop on an element: its literal value where it has one, and the attribute to point a finding at. */
export interface JsxAttribute {
  value: string | undefined;
  node: JSXAttribute;
}

/** What an element rule sees: one element whose tag is a plain identifier (`button`, `Button` — not `Menu.Item`). */
export interface JsxElement {
  node: JSXOpeningElement;
  tag: string;
  /** The design-system component the tag names, if any. */
  component?: ComponentContract;
  attributes: Map<string, JsxAttribute>;
  /** The classes its `className` could produce, when it has one. */
  classes?: Set<string>;
  owners: InvalidAlternativeOwners;
  filePath?: string;
}

/** What a file rule sees: the whole parsed file, for scenarios spanning a component rather than one element. */
export interface JsxFile {
  ast: File;
  designSystem: boolean;
}

/** What an import rule sees: one import that reaches runtime. */
export interface JsxImport {
  node: ImportDeclaration;
  owners: InvalidAlternativeOwners;
  designSystem: boolean;
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

function readAttributes(node: JSXOpeningElement): Map<string, JsxAttribute> {
  const attributes = new Map<string, JsxAttribute>();
  for (const attr of node.attributes) {
    if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') continue;
    attributes.set(attr.name.name, { value: literalAttrValue(attr), node: attr });
  }
  return attributes;
}

/**
 * Runs `fileRules` on the whole file, then walks it once: every runtime import through `importRules`, every
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
  options: { designSystem?: boolean; filePath?: string } = {},
): Finding[] {
  const { designSystem = false, filePath } = options;
  const findings: Finding[] = fileRules.flatMap((rule) => rule({ ast, designSystem }));

  traverse(ast, {
    ImportDeclaration(nodePath) {
      const node = nodePath.node;
      // A type-only import never reaches runtime.
      if (node.importKind === 'type') return;
      if (
        node.specifiers.length > 0 &&
        node.specifiers.every(
          (specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type',
        )
      )
        return;
      const subject: JsxImport = { node, owners, designSystem, filePath };
      findings.push(...importRules.flatMap((rule) => rule(subject)));
    },
    JSXOpeningElement(nodePath) {
      const node = nodePath.node;
      const classNameValue = findAttributeValue(node, 'className');

      if (node.name.type === 'JSXIdentifier') {
        const tag = node.name.name;
        const subject: JsxElement = {
          node,
          tag,
          component: system.component(tag),
          attributes: readAttributes(node),
          classes: classNameValue ? classNameAdapter.classNameTokens(classNameValue) : undefined,
          owners,
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

  return findings;
}
