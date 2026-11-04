import type { Finding, Rule } from '../../../types.js';
import { position, traverse } from '../../ast.js';
import type { JsxFile } from '../../tsx-adapter.js';
import { controllerSite } from '../forms.js';

/**
 * Wherever Controller hands over `field`, the field must be connected to it:
 * `{...field}`, `field` passed whole, `field.value` or `field.onChange`,
 * under whatever props the field component names them. Only a Controller
 * that uses none of these is invalid; wiring a connected field correctly is
 * left to whoever writes it. Never depends on the component's prop names.
 */
export const unlinkedControllerField: Rule<JsxFile> = ({ ast, designSystem }) => {
  // The design system builds its own fields; only its consumers are held to its form tooling.
  if (designSystem) return [];
  const findings: Finding[] = [];

  traverse(ast, {
    Function(fn) {
      const site = controllerSite(fn);
      if (!site?.bindings) return;
      const { bindings } = site;
      let connected = false;

      fn.traverse({
        Identifier(identifier) {
          if (!identifier.isReferencedIdentifier()) return;
          const { name } = identifier.node;
          if (name === bindings.value || name === bindings.onChange) connected = true;
          if (name !== bindings.field) return;
          const parent = identifier.parentPath;
          const member =
            (parent.isMemberExpression() || parent.isOptionalMemberExpression()) && parent.node.object === identifier.node;
          // `{...field}` or `field` passed whole, else `field.value` / `field.onChange`.
          const property =
            member && !parent.node.computed && parent.node.property.type === 'Identifier'
              ? parent.node.property.name
              : undefined;
          if (!member || property === 'value' || property === 'onChange') connected = true;
          if (connected) identifier.stop();
        },
      });

      if (connected) return;
      findings.push({
        rule: 'unlinked-controller-field',
        severity: 'error',
        surface: 'jsx',
        ...position(site.at),
        message:
          "This Controller's field is never connected to it: nothing uses {...field}, field.value or " +
          'field.onChange, so Controller validates a value no field shows. Spread {...field} into the field, or pass ' +
          'field.value and field.onChange to whichever props hold its value and report its changes.',
        suggestion: '{({ field }) => <Field {...field} />}',
      });
    },
  });

  return findings;
};
