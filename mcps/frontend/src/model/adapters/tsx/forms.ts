import type { NodePath } from '@babel/traverse';
import type { CallExpression, Function as FunctionNode, Node, ObjectPattern } from '@babel/types';

/** The hook a call's callee names: `useState` for both `useState(...)` and `React.useState(...)`. */
export function hookName(callee: CallExpression['callee']): string | undefined {
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') return callee.property.name;
  return undefined;
}

/** Does this function call `hook` itself — not inside a nested callback? */
export function callsHook(fn: NodePath<FunctionNode>, hook: string): boolean {
  let found = false;
  fn.traverse({
    CallExpression(call) {
      if (call.getFunctionParent()?.node === fn.node && hookName(call.node.callee) === hook) {
        found = true;
        call.stop();
      }
    },
  });
  return found;
}

/** How Controller's `field` is named where an element can use it. */
export interface FieldBindings {
  /** `field` itself: `field`, or `f` from `{ field: f }`. */
  field?: string;
  /** `value` and `onChange` when destructured out of it: `{ field: { value, onChange } }`. */
  value?: string;
  onChange?: string;
}

function bindingsFromPattern(pattern: ObjectPattern): FieldBindings {
  for (const property of pattern.properties) {
    if (property.type !== 'ObjectProperty' || property.computed) continue;
    if (property.key.type !== 'Identifier' || property.key.name !== 'field') continue;
    const target = property.value.type === 'AssignmentPattern' ? property.value.left : property.value;
    if (target.type === 'Identifier') return { field: target.name };
    if (target.type !== 'ObjectPattern') return {};
    const bindings: FieldBindings = {};
    for (const inner of target.properties) {
      if (inner.type !== 'ObjectProperty' || inner.computed || inner.key.type !== 'Identifier') continue;
      if (inner.value.type !== 'Identifier') continue;
      if (inner.key.name === 'value') bindings.value = inner.value.name;
      if (inner.key.name === 'onChange') bindings.onChange = inner.value.name;
    }
    return bindings;
  }
  return {};
}

function isController(path: NodePath | null): boolean {
  return Boolean(
    path?.isJSXOpeningElement() &&
      path.node.name.type === 'JSXIdentifier' &&
      path.node.name.name === 'Controller',
  );
}

/** A Controller's render function: `<Controller>{({ field }) => …}</Controller>` or `render={({ field }) => …}`. */
function isControllerRender(fn: NodePath<FunctionNode>): boolean {
  const container = fn.parentPath;
  if (!container?.isJSXExpressionContainer()) return false;
  const owner = container.parentPath;
  if (owner?.isJSXElement()) return isController(owner.get('openingElement'));
  return Boolean(
    owner?.isJSXAttribute() &&
      owner.node.name.type === 'JSXIdentifier' &&
      owner.node.name.name === 'render' &&
      isController(owner.parentPath),
  );
}

/** Where Controller hands over `field`: a Controller render function, or a function holding a `useController()` result. */
export interface ControllerSite {
  /** The `<Controller>` element, or the `useController()` declaration — where a finding points. */
  at: Node;
  /** How `field` is named there; `undefined` when it can't be told (e.g. `(props) => …`). */
  bindings: FieldBindings | undefined;
}

export function controllerSite(fn: NodePath<FunctionNode>): ControllerSite | undefined {
  if (isControllerRender(fn)) {
    const param = fn.node.params[0];
    const controller = fn.findParent((parent) => parent.isJSXOpeningElement() || parent.isJSXElement())!;
    return {
      at: controller.isJSXElement() ? controller.node.openingElement : controller.node,
      bindings: !param ? {} : param.type === 'ObjectPattern' ? bindingsFromPattern(param) : undefined,
    };
  }
  let site: ControllerSite | undefined;
  fn.traverse({
    VariableDeclarator(declarator) {
      const { id, init } = declarator.node;
      if (declarator.getFunctionParent()?.node !== fn.node) return;
      if (init?.type !== 'CallExpression' || hookName(init.callee) !== 'useController') return;
      site = { at: declarator.node, bindings: id.type === 'ObjectPattern' ? bindingsFromPattern(id) : undefined };
      declarator.stop();
    },
  });
  return site;
}
