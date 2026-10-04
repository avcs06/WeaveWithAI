import type { NodePath } from '@babel/traverse';
import type { Expression, Function as FunctionNode, JSXOpeningElement } from '@babel/types';

import type { Finding, Rule } from '../../../types.js';
import { position, traverse } from '../../ast.js';
import type { JsxFile } from '../../tsx-adapter.js';
import { callsHook, controllerSite, hookName } from '../forms.js';

function tagName(name: JSXOpeningElement['name']): string {
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXNamespacedName') return `${name.namespace.name}:${name.name.name}`;
  return `${tagName(name.object)}.${name.property.name}`;
}

/** Props that only an element holding a value has. A literal `value` (an option's identity) doesn't count. */
const VALUE_PROPS = new Set(['onChange', 'checked', 'defaultChecked', 'defaultValue']);

function isLiteral(expression: Expression): boolean {
  return (
    expression.type === 'StringLiteral' ||
    expression.type === 'NumericLiteral' ||
    expression.type === 'BooleanLiteral' ||
    (expression.type === 'TemplateLiteral' && expression.expressions.length === 0)
  );
}

/** Does this element hold a form value — bound to state, handling its changes, or registered with `register()`? */
function holdsFormValue(node: JSXOpeningElement): boolean {
  return node.attributes.some((attribute) => {
    if (attribute.type === 'JSXSpreadAttribute') {
      return attribute.argument.type === 'CallExpression' && hookName(attribute.argument.callee) === 'register';
    }
    if (attribute.name.type !== 'JSXIdentifier') return false;
    if (VALUE_PROPS.has(attribute.name.name)) return true;
    return (
      attribute.name.name === 'value' &&
      attribute.value?.type === 'JSXExpressionContainer' &&
      attribute.value.expression.type !== 'JSXEmptyExpression' &&
      !isLiteral(attribute.value.expression)
    );
  });
}


/**
 * Every field in a form holds a form value, and every form value goes
 * through the design system's Controller: its `rules` are the only place
 * validation lives, and the `field` it hands over carries the value,
 * onChange, required and error the design system's fields render. A form is
 * a `<form>` element, or a component that calls `useForm`.
 */
export const fieldOutsideController: Rule<JsxFile> = ({ ast, designSystem }) => {
  // The design system builds its own fields; only its consumers are held to its form tooling.
  if (designSystem) return [];
  const findings: Finding[] = [];
  const formComponents = new Map<FunctionNode, boolean>();
  const inForm = (element: NodePath<JSXOpeningElement>): boolean =>
    Boolean(
      element.findParent((parent) => {
        if (parent.isJSXElement()) {
          const name = parent.node.openingElement.name;
          return name.type === 'JSXIdentifier' && name.name === 'form';
        }
        if (!parent.isFunction()) return false;
        if (!formComponents.has(parent.node)) formComponents.set(parent.node, callsHook(parent, 'useForm'));
        return formComponents.get(parent.node)!;
      }),
    );

  traverse(ast, {
    JSXOpeningElement(element) {
      const { node } = element;
      // Inside a Controller (or a useController component), unlinked-controller-field takes over.
      const throughController = element.findParent((parent) => parent.isFunction() && Boolean(controllerSite(parent)));
      if (!holdsFormValue(node) || throughController || !inForm(element)) return;
      const tag = tagName(node.name);
      findings.push({
        rule: 'field-outside-controller',
        severity: 'error',
        surface: 'jsx',
        ...position(node),
        message:
          `<${tag}> holds a form value outside Controller. Render every form field through the design system's ` +
          'Controller: its validation goes in `rules`, and spreading {...field} gives the field its value, onChange, ' +
          "required and error — what the design system's fields need to show the required mark and error message.",
        suggestion: `<Controller name="…" control={form.control} rules={{ … }}>\n  {({ field }) => <${tag} {...field} />}\n</Controller>`,
      });
    },
  });

  return findings;
};
