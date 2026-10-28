import type { Finding, Rule } from '../../../types.js';
import { position } from '../../ast.js';
import type { JsxElement } from '../../tsx-adapter.js';

/**
 * For a recognized component (unrecognized tags aren't checked), checks every
 * variant-like prop's literal value against its allowed set. The message names
 * the constraint and the legal alternatives so an agent can act on it.
 */
export const unknownVariant: Rule<JsxElement> = ({ component, attributes }) => {
  if (!component) return [];
  const findings: Finding[] = [];
  for (const [propName, { value, node }] of attributes) {
    if (!component.variantProps.includes(propName)) continue;

    const allowedValues = component.props.find((p) => p.name === propName)?.allowedValues;
    if (!allowedValues) continue;
    if (value === undefined || allowedValues.includes(value)) continue;

    findings.push({
      rule: 'unknown-variant',
      severity: 'error',
      surface: 'jsx',
      ...position(node),
      message: `${propName} must be one of ${allowedValues.join(' | ')}, got "${value}".`,
    });
  }
  return findings;
};
