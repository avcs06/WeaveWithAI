import type { Finding, Rule } from '../../../types.js';
import { position } from '../../ast.js';
import type { JsxElement } from '../../tsx-adapter.js';

/**
 * A component used without a prop its `@requiredProp` tag names: a layout it
 * leaves to every caller, like a group's `className`. Design-system code and
 * recipes set them on purpose, and a spread of unknown props may carry one.
 */
export const requiredProp: Rule<JsxElement> = ({ component, attributes, openSpread, designSystem, recipe, node }) => {
  if (!component?.requiredProps?.length || designSystem || recipe || openSpread) return [];
  return component.requiredProps
    .filter((name) => !attributes.has(name))
    .map((name): Finding => {
      const description = component.props.find((prop) => prop.name === name)?.description;
      return {
        rule: 'required-prop',
        severity: 'error',
        surface: 'jsx',
        ...position(node),
        message: `${component.name} takes \`${name}\` on every use${description ? `: ${description.replace(/\.$/, '')}` : ''}.`,
      };
    });
};
