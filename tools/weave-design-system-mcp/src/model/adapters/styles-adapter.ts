import type { File, ObjectExpression } from '@babel/types';

import type { DesignSystem, DesignToken, Finding, Rule, Surface, VanillaExtractPolicy } from '../types.js';
import * as objectStyles from './styles/object.js';
import { forbiddenLayout } from './styles/rules/forbidden-layout.js';
import { hardcodedLiteral } from './styles/rules/hardcoded-literal.js';
import { preferTailwind } from './styles/rules/prefer-tailwind.js';
import * as vanillaExtractStyles from './styles/vanilla-extract.js';

/**
 * A pure dispatcher: token readers and style-object discovery live under
 * `styles/`, every check is a rule under `styles/rules/`. Token file format is
 * inferred; style-defining code is always vanilla-extract. Another styling
 * system means a new file beside `styles/vanilla-extract.ts` and switching
 * `validateStyles` to it, never touching `validate.ts` or the TSX adapter.
 */

/** What a style rule sees: one style object literal. */
export interface StyleObject {
  object: ObjectExpression;
  system: DesignSystem;
  policy: VanillaExtractPolicy;
  surface: Surface;
}

/** Each known scenario is one file under `styles/rules/`, listed in the registry it applies to. */
const styleRules: Rule<StyleObject>[] = [forbiddenLayout, hardcodedLiteral, preferTailwind];
/** An inline `style={{}}` is React, not a styling system: only the token check applies. */
const inlineStyleRules: Rule<StyleObject>[] = [hardcodedLiteral];

/** Checks an inline JSX `style={{}}` prop. */
export function checkStyleObject(object: ObjectExpression, system: DesignSystem, surface: Surface): Finding[] {
  return inlineStyleRules.flatMap((rule) => rule({ object, system, policy: {}, surface }));
}

/**
 * Reads one token file, inferring its format: a vanilla-extract theme when it
 * imports a theme-defining call, else a plain object (JSON or module exports).
 */
export function loadTokens(filePath: string): DesignToken[] {
  if (vanillaExtractStyles.isThemeFile(filePath)) return vanillaExtractStyles.loadTokens(filePath);
  return objectStyles.loadTokens(filePath);
}

/**
 * `validate`'s entry point for style-defining code (always vanilla-extract),
 * named styling-system-agnostic so callers don't change if that does.
 */
export function validateStyles(ast: File, system: DesignSystem, policy: VanillaExtractPolicy): Finding[] {
  return vanillaExtractStyles
    .styleObjects(ast)
    .flatMap((object) => styleRules.flatMap((rule) => rule({ object, system, policy, surface: 'vanilla-extract' })));
}
