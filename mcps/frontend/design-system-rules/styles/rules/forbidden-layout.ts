import type { ObjectExpression } from '@babel/types';

import type { Finding, Rule } from '../../../types.js';
import { position } from '../../ast.js';
import type { StyleObject } from '../../styles-adapter.js';

const CONDITIONAL_KEYS = new Set(['selectors', '@media', '@supports', '@container', '@layer']);

/** Layout properties the policy reserves for Tailwind may not appear in a style object, outside conditional blocks. */
export const forbiddenLayout: Rule<StyleObject> = ({ object, policy }) => {
  const forbidden = policy.forbiddenProperties ?? new Set<string>();
  const findings: Finding[] = [];

  const walk = (node: ObjectExpression): void => {
    for (const property of node.properties) {
      if (property.type !== 'ObjectProperty' || property.computed) continue;
      const key =
        property.key.type === 'Identifier'
          ? property.key.name
          : property.key.type === 'StringLiteral'
            ? property.key.value
            : undefined;
      if (!key) continue;
      if (forbidden.has(key)) {
        findings.push({
          rule: 'forbidden-vanilla-layout',
          severity: 'error',
          surface: 'vanilla-extract',
          ...position(property),
          message: `The top-level Vanilla Extract property "${key}" is prohibited. Express it with an approved Tailwind utility.`,
        });
      }
      if (property.value.type === 'ObjectExpression' && !CONDITIONAL_KEYS.has(key)) walk(property.value);
    }
  };

  walk(object);
  return findings;
};
