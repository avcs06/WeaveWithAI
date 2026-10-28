import type { Node, VariableDeclarator } from '@babel/types';

import type { Finding, Rule } from '../../../types.js';
import { position, traverse } from '../../ast.js';
import type { JsxFile } from '../../tsx-adapter.js';
import { callsHook, hookName } from '../forms.js';

interface StateBinding {
  value?: string;
  setter?: string;
  node: VariableDeclarator;
}

/**
 * A component that submits a form while holding its field values or error
 * messages in `useState`, with no `useForm` — validation written by hand,
 * checked by hand on submit. react-hook-form already holds the values, and
 * the design system's Controller turns each field's `rules` into the
 * `required` and `error` its fields render.
 */
export const manualFormState: Rule<JsxFile> = ({ ast, designSystem }) => {
  // The design system builds its own fields; only its consumers are held to its form tooling.
  if (designSystem) return [];
  const findings: Finding[] = [];

  traverse(ast, {
    Function(fn) {
      const states: StateBinding[] = [];
      const boundToFields = new Set<string>();
      let submits = false;

      fn.traverse({
        VariableDeclarator(declarator) {
          if (declarator.getFunctionParent()?.node !== fn.node) return;
          const { id, init } = declarator.node;
          if (id.type !== 'ArrayPattern' || init?.type !== 'CallExpression') return;
          if (hookName(init.callee) !== 'useState') return;
          const [value, setter] = id.elements;
          states.push({
            value: value?.type === 'Identifier' ? value.name : undefined,
            setter: setter?.type === 'Identifier' ? setter.name : undefined,
            node: declarator.node,
          });
        },
        JSXOpeningElement(element) {
          if (element.node.name.type === 'JSXIdentifier' && element.node.name.name === 'form') submits = true;
        },
        JSXAttribute(attribute) {
          const { name, value } = attribute.node;
          if (name.type !== 'JSXIdentifier') return;
          if (name.name === 'onSubmit') submits = true;
          // `value={email}` or `value={values.email}`: the state backs a field.
          if ((name.name === 'value' || name.name === 'checked') && value?.type === 'JSXExpressionContainer') {
            let root: Node = value.expression;
            while (root.type === 'MemberExpression') root = root.object;
            if (root.type === 'Identifier') boundToFields.add(root.name);
          }
        },
      });

      if (!states.length || !submits || callsHook(fn, 'useForm')) return;
      const errorStates = states.filter(({ value, setter }) => /error/i.test(value ?? setter ?? ''));
      const fieldStates = states.filter(({ value }) => value && boundToFields.has(value));
      if (!errorStates.length && !fieldStates.length) return;

      const kind =
        errorStates.length && fieldStates.length
          ? 'field values and error messages'
          : errorStates.length
            ? 'error messages'
            : 'field values';
      const names = [...new Set([...fieldStates, ...errorStates])].map(({ value, setter }) => value ?? setter);
      findings.push({
        rule: 'manual-form-state',
        severity: 'error',
        surface: 'jsx',
        ...position((fieldStates[0] ?? errorStates[0])!.node),
        message:
          `This form keeps its ${kind} in useState (${names.join(', ')})` +
          `${errorStates.length ? ' and validates by hand' : ''}. ` +
          "Manage it with react-hook-form: useForm holds the values, every field renders through the design system's " +
          'Controller with its validation in `rules` — Controller hands each field its required and error state — ' +
          'and form.handleSubmit submits only valid values.',
        suggestion:
          'const form = useForm<Values>({ defaultValues });\n' +
          '<form onSubmit={form.handleSubmit(onSubmit)}>\n' +
          "  <Controller name=\"email\" control={form.control} rules={{ required: 'Email is required' }}>\n" +
          '    {({ field }) => <Field {...field} label="Email" />}\n' +
          '  </Controller>\n' +
          '</form>',
      });
    },
  });

  return findings;
};
