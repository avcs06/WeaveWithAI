import type { ObjectExpression, ObjectProperty } from '@babel/types';

import type { Finding, Rule } from '../../../types.js';
import type { StyleObject } from '../../styles-adapter.js';

/** A `${...}` in a computed key, read as some other class: `${parent} &` targets `&`, `& ${child}` doesn't. */
const EXPRESSION = '.x';

/** The key's selector text, or undefined for a key that isn't one. */
function selectorOf(prop: ObjectProperty): string | undefined {
  const { key } = prop;
  if (key.type === 'StringLiteral') return key.value;
  if (key.type !== 'TemplateLiteral') return undefined;
  return key.quasis.map((quasi, index) => (index === 0 ? '' : EXPRESSION) + quasi.value.cooked).join('');
}

/** The selector split at its top-level commas, outside brackets, parentheses and quotes. */
function splitList(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let index = 0; index < selector.length; index++) {
    const char = selector.charAt(index);
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '(' || char === '[') depth++;
    else if (char === ')' || char === ']') depth--;
    else if (char === ',' && depth === 0) {
      parts.push(selector.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(selector.slice(start));
  return parts.map((part) => part.trim());
}

/**
 * Whether the element this selector styles is `&`: its last compound selector,
 * after the last top-level combinator, has `&` outside any parentheses. The
 * check vanilla-extract runs when it builds, which fails on anything else.
 */
function targetsSelf(selector: string): boolean {
  let depth = 0;
  let quote = '';
  let hasSelf = false;
  for (let index = 0; index < selector.length; index++) {
    const char = selector.charAt(index);
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '(' || char === '[') depth++;
    else if (char === ')' || char === ']') depth--;
    else if (depth === 0 && /[\s>+~]/.test(char)) hasSelf = false;
    else if (depth === 0 && char === '&') hasSelf = true;
  }
  return hasSelf;
}

/**
 * A key of a `selectors` object that styles another element than the style's
 * own, like `'& a'` or `'&:hover span'`. vanilla-extract refuses it and the
 * build fails, so the page doesn't render. `globalStyle` takes any selector and
 * isn't checked here.
 */
export const invalidSelector: Rule<StyleObject> = ({ object, surface }) => {
  const findings: Finding[] = [];

  const walk = (node: ObjectExpression, inSelectors: boolean) => {
    for (const prop of node.properties) {
      if (prop.type !== 'ObjectProperty') continue;

      const selector = inSelectors ? selectorOf(prop) : undefined;
      const bad = selector === undefined ? [] : splitList(selector).filter((part) => !targetsSelf(part));
      for (const part of bad) {
        const loc = prop.key.loc;
        findings.push({
          rule: 'invalid-selector',
          severity: 'error',
          surface,
          line: loc ? loc.start.line : 0,
          column: loc ? loc.start.column + 1 : 0,
          message:
            `Move "${part}" out of \`selectors\`: it styles another element than this style's own, and vanilla-extract fails the build on it, so the page doesn't render. ` +
            `A selector there must end on "&", as in "&:hover" or "\${parent} &". ` +
            `To style that element, give it its own style(), or add globalStyle(\`${part.replaceAll('&', '${name}')}\`, { ... }) after this style, where name is the constant this style is assigned to.`,
        });
      }

      const key =
        prop.key.type === 'Identifier'
          ? prop.key.name
          : prop.key.type === 'StringLiteral'
            ? prop.key.value
            : '';
      const isSelectors = !inSelectors && key === 'selectors';
      if (prop.value.type === 'ObjectExpression') walk(prop.value, isSelectors);
    }
  };

  walk(object, false);
  return findings;
};
