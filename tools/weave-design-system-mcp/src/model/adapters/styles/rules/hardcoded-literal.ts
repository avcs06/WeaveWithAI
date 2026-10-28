import type { Expression, ObjectExpression } from '@babel/types';

import type { Finding, Rule } from '../../../types.js';
import type { StyleObject } from '../../styles-adapter.js';

/**
 * Maps a style-object property to the token group that governs it. Every
 * supported styling system (and a React inline `style` prop) uses camelCase
 * keys, so this is written once and shared.
 *
 * Group *names* are a convention: a check fires only when the design system's
 * token set has a group by that exact name. `width`/`height` are excluded: too
 * overloaded (icon size vs. card layout width) to map to one group without
 * many false positives.
 */
const PROPERTY_TO_GROUP: Record<string, string> = {
  color: 'color',
  backgroundColor: 'color',
  background: 'color',
  borderColor: 'color',
  borderTopColor: 'color',
  borderRightColor: 'color',
  borderBottomColor: 'color',
  borderLeftColor: 'color',
  outlineColor: 'color',
  textDecorationColor: 'color',
  caretColor: 'color',
  fill: 'color',
  stroke: 'color',

  padding: 'spacing',
  paddingTop: 'spacing',
  paddingRight: 'spacing',
  paddingBottom: 'spacing',
  paddingLeft: 'spacing',
  paddingInline: 'spacing',
  paddingBlock: 'spacing',
  margin: 'spacing',
  marginTop: 'spacing',
  marginRight: 'spacing',
  marginBottom: 'spacing',
  marginLeft: 'spacing',
  marginInline: 'spacing',
  marginBlock: 'spacing',
  gap: 'spacing',
  rowGap: 'spacing',
  columnGap: 'spacing',
  inset: 'spacing',
  top: 'spacing',
  left: 'spacing',
  right: 'spacing',
  bottom: 'spacing',

  // typography: separate groups, as real token sets keep these distinct
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  lineHeight: 'lineHeight',
  letterSpacing: 'letterSpacing',

  borderRadius: 'radius',
  borderTopLeftRadius: 'radius',
  borderTopRightRadius: 'radius',
  borderBottomLeftRadius: 'radius',
  borderBottomRightRadius: 'radius',

  // border width
  borderWidth: 'borderWidth',
  borderTopWidth: 'borderWidth',
  borderRightWidth: 'borderWidth',
  borderBottomWidth: 'borderWidth',
  borderLeftWidth: 'borderWidth',
  outlineWidth: 'borderWidth',

  boxShadow: 'shadow',
  textShadow: 'shadow',

  transitionDuration: 'motion',
  animationDuration: 'motion',
  transitionDelay: 'motion',
  animationDelay: 'motion',
  transitionTimingFunction: 'motion',
  animationTimingFunction: 'motion',

  opacity: 'opacity',
  zIndex: 'zIndex',
};

/** Generic values that are never a design decision worth tokenizing, regardless of property. */
const GENERIC_VALUES = new Set([
  'inherit',
  'initial',
  'unset',
  'none',
  'auto',
  'transparent',
  'currentcolor',
  '0',
]);

function isLiteralValue(node: Expression): string | undefined {
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'NumericLiteral') return String(node.value);
  // A TemplateLiteral (e.g. `0 0 0 3px color-mix(in srgb, ${theme.shadow} 16%,
  // transparent)`) often mixes a token reference with literal structure; it
  // counts as a reference, not flagged.
  return undefined;
}

/**
 * Recursively walks an object literal (a style-authoring call's argument, a
 * nested variant object, or a JSX `style={{}}` prop) looking for a *governed*
 * property set to a literal instead of a token/theme reference. Nested keys
 * get no special treatment (selectors, media queries, variants): every nested
 * object is walked the same way, and quoted keys (`'&:hover'`) read like bare
 * ones.
 *
 * Shared by every styles implementation and the TSX adapter's inline `style`
 * check, so "which properties map to which token group" lives in one place.
 */
export const hardcodedLiteral: Rule<StyleObject> = ({ object, system, surface }) => {
  const findings: Finding[] = [];

  const walk = (node: ObjectExpression) => {
    for (const prop of node.properties) {
      if (prop.type !== 'ObjectProperty') continue;

      const key =
        prop.key.type === 'Identifier'
          ? prop.key.name
          : prop.key.type === 'StringLiteral'
            ? prop.key.value
            : undefined;
      if (key === undefined) continue;

      const value = prop.value as Expression;
      if (value.type === 'ObjectExpression') {
        walk(value);
        continue;
      }

      const group = PROPERTY_TO_GROUP[key];
      if (!group) continue; // not a governed property

      if (system.tokens(group).length === 0) continue; // this design system has no tokens for this group at all

      const literal = isLiteralValue(value);
      if (literal === undefined) continue; // a reference (identifier/member expression), not a literal — fine
      if (/!important\s*$/i.test(literal)) continue;
      if (GENERIC_VALUES.has(literal.toLowerCase())) continue;

      // Unitless line heights are font-relative, not fixed-pixel scale values.
      if (key === 'lineHeight' && value.type === 'NumericLiteral') continue;
      // Local stacking contexts may use literal levels; suggest only an exact
      // named layer.
      if (key === 'zIndex' && !system.tokens(group).some((token) => token.value === literal)) continue;

      const nearest = system.nearestToken(literal, group);
      const loc = value.loc;
      findings.push({
        rule: 'hardcoded-literal',
        severity: 'error',
        surface,
        line: loc ? loc.start.line : 0,
        column: loc ? loc.start.column + 1 : 0,
        message: `"${key}: ${literal}" hardcodes a ${group} value instead of using a design token.${
          nearest ? ` The closest token is "${nearest.name}".` : ''
        }`,
        suggestion: nearest?.reference,
      });
    }
  };

  walk(object);
  return findings;
};
