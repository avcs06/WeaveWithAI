import type { Node } from '@babel/types';

import type { ComponentContract, Finding, Rule } from '../../../types.js';
import { position } from '../../ast.js';
import { reasonHint, reasonOf } from '../../reason.js';
import type { JsxElement } from '../../tsx-adapter.js';

const finding = (rule: string, node: Node, message: string): Finding => ({
  rule,
  severity: 'error',
  surface: 'jsx',
  ...position(node),
  message,
});

/** The look tokens of a component, as the template's `createLook` reads them, each with the variant and value it sets. */
function lookTokens(component: ComponentContract): Map<string, [variant: string, value: string]> {
  const tokens = new Map<string, [string, string]>();
  for (const look of component.looks ?? [])
    if (look.boolean) {
      tokens.set(look.name, [look.name, 'true']);
      tokens.set(`!${look.name}`, [look.name, 'false']);
    } else for (const value of look.values) tokens.set(value, [look.name, value]);
  return tokens;
}

/** A `look` names styles: each token must be one the component takes, and one that changes a default needs a comment saying why. */
function lookFindings(component: ComponentContract, value: string, node: Node, own: boolean): Finding[] {
  const tokens = lookTokens(component);
  const asked = value.split(/\s+/).filter(Boolean);
  const unknown = asked.filter((token) => !tokens.has(token));
  if (unknown.length)
    return [finding('unknown-variant', node, `look takes ${[...tokens.keys()].join(' | ')}, got "${unknown.join(' ')}".`)];
  const defaultOf = (variant: string) => {
    const look = component.looks?.find((l) => l.name === variant);
    return look?.default ?? (look?.boolean ? 'false' : undefined);
  };
  const changes = asked.filter((token) => {
    const [variant, set] = tokens.get(token) ?? ['', ''];
    return set !== defaultOf(variant);
  });
  if (!own || !changes.length) return [];
  const reason = reasonOf(node, (node as { value?: Node }).value);
  if (reason === 'own') return [];
  return [
    finding(
      'non-default-variant',
      node,
      `look="${value}" changes ${component.name}'s default look, which the theme sets (${changes.join(', ')}). Leave it out to keep the default.${reasonHint(reason)}`,
    ),
  ];
}

/**
 * For a recognized component (unrecognized tags aren't checked), checks every
 * variant-like prop's literal value against its allowed set, naming the legal
 * alternatives. In app code, a valid value other than the default the theme
 * set needs a comment giving the author's own reason (`non-default-variant`);
 * design-system code and recipes choose their variants on purpose.
 */
export const unknownVariant: Rule<JsxElement> = ({ component, attributes, designSystem, recipe }) => {
  if (!component) return [];
  const own = !designSystem && !recipe;
  const findings: Finding[] = [];
  for (const [propName, { value, node }] of attributes) {
    if (propName === 'look' && component.looks?.length) {
      if (value !== undefined) findings.push(...lookFindings(component, value, node, own));
      continue;
    }
    if (!component.variantProps.includes(propName)) continue;
    const prop = component.props.find((p) => p.name === propName);
    const allowedValues = prop?.allowedValues;
    if (!allowedValues || value === undefined) continue;
    if (!allowedValues.includes(value)) {
      findings.push(finding('unknown-variant', node, `${propName} must be one of ${allowedValues.join(' | ')}, got "${value}".`));
      continue;
    }
    if (!own || prop.default === undefined || value === prop.default) continue;
    const reason = reasonOf(node, (node as { value?: Node }).value);
    if (reason === 'own') continue;
    findings.push(
      finding(
        'non-default-variant',
        node,
        `${propName}="${value}" is not ${component.name}'s default ("${prop.default}"), which the theme sets. Leave it out to keep the default.${reasonHint(reason)}`,
      ),
    );
  }
  return findings;
};
