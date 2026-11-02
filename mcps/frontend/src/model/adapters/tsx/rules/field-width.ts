import type { Finding, Rule } from '../../../types.js';
import { position } from '../../ast.js';
import type { JsxElement } from '../../tsx-adapter.js';

/** A class that sizes an element's width, or lets it grow. */
const WIDTH_CLASS = /^(?:w|min-w|max-w|basis)-|^(?:flex-1|flex-auto|flex-fill-x|grow)$/;

/**
 * A field inside a Form sized by a class. Fields take their width from the
 * Form, 1x by default, and a field whose content needs another sets `width`
 * to one of the multiples, so the fields of one form line up. A field is a
 * component with that `width` prop.
 */
export const fieldWidth: Rule<JsxElement> = ({ component, classes, ancestors, attributes, designSystem, recipe, node }) => {
  if (!component || designSystem || recipe || !ancestors.includes('Form')) return [];
  const width = component.props.find((prop) => prop.name === 'width' && prop.allowedValues?.includes('1x'));
  if (!width?.allowedValues) return [];
  const sized = [...(classes ?? [])].filter((name) => WIDTH_CLASS.test(name));
  if (!sized.length) return [];
  const finding: Finding = {
    rule: 'field-width',
    severity: 'error',
    surface: 'jsx',
    ...position(attributes.get('className')?.node ?? node),
    message: `${component.name} takes its width from the Form: leave out ${sized.map((name) => `"${name}"`).join(', ')}, and set \`width\` to one of ${width.allowedValues.join(' | ')} when 1x does not fit its content.`,
  };
  return [finding];
};
