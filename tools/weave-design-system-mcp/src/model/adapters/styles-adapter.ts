import type { File, ObjectExpression } from '@babel/types';

import type { DesignSystem, DesignToken, Finding, Rule, Surface, VanillaExtractPolicy } from '../types.js';
import * as objectStyles from './styles/object.js';
import { forbiddenLayout } from './styles/rules/forbidden-layout.js';
import { hardcodedLiteral } from './styles/rules/hardcoded-literal.js';
import { preferTailwind } from './styles/rules/prefer-tailwind.js';
import * as vanillaExtractStyles from './styles/vanilla-extract.js';

/**
 * This file is a pure dispatcher — it contains no styling-system-specific
 * code of its own. Token readers and style-object discovery live under
 * `styles/`, and every check is a rule under `styles/rules/`, listed below.
 * A token file's format is inferred from the file; style-defining code is
 * always vanilla-extract. Supporting another styling system (Sass modules,
 * styled-components, whatever) means writing a new file next to
 * `styles/vanilla-extract.ts` and switching `validateStyles` to it — never
 * touching `validate.ts` or the TSX adapter, which only ever call this file.
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
 * imports a theme-defining call, otherwise a plain object (JSON, or a
 * module's exported objects, evaluated).
 */
export function loadTokens(filePath: string): DesignToken[] {
  if (vanillaExtractStyles.isThemeFile(filePath)) return vanillaExtractStyles.loadTokens(filePath);
  return objectStyles.loadTokens(filePath);
}

/**
 * `validate`'s entry point for style-defining code — styling-system
 * *agnostic* in name and signature, so callers don't change if the styling
 * system does. Styles are always vanilla-extract.
 */
export function validateStyles(ast: File, system: DesignSystem, policy: VanillaExtractPolicy): Finding[] {
  return vanillaExtractStyles
    .styleObjects(ast)
    .flatMap((object) => styleRules.flatMap((rule) => rule({ object, system, policy, surface: 'vanilla-extract' })));
}
