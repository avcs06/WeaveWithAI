import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Inventory } from '../../../../ds/inventory';
import type { Scope } from '../../../01flows/01scope/schema';
import { buildTheme } from '../build';
import type { ThemeCall } from '../schema';
import type { BriefInput, CallInput, ThemeInput } from './helpers';
import { rule as brief001 } from './rules/brief-001-ranges';
import { rule as brief002 } from './rules/brief-002-entities';
import { rule as brief003 } from './rules/brief-003-hues-apart';
import { rule as brief005 } from './rules/brief-005-font-candidates';
import { rule as theme001 } from './rules/theme-001-text-contrast';
import { rule as theme002 } from './rules/theme-002-edge-contrast';
import { rule as theme004 } from './rules/theme-004-fonts-radius-ring';
import { rule as theme005 } from './rules/theme-005-hex';
import { rule as theme006 } from './rules/theme-006-layouts';
import { rule as theme007 } from './rules/theme-007-frame-spacing';
import { rule as theme008 } from './rules/theme-008-semantic-defaults';
import { rule as theme009 } from './rules/theme-009-quiet-colors';
import { rule as theme010 } from './rules/theme-010-modes-entities';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

export const briefRules: readonly Rule<BriefInput>[] = [
  brief001,
  brief002,
  brief003,
  brief005,
];

export const callRules: readonly Rule<CallInput>[] = [theme010];

/** THEME-003 checks an applied app and comes with S1. */
export const themeRules: readonly Rule<ThemeInput>[] = [
  theme001,
  theme002,
  theme004,
  theme005,
  theme006,
  theme007,
  theme008,
  theme009,
];

/** The theme call's answer: the brief against the scope, the colors against the brief, and the theme they build (D3.3 F). */
export function validateTheme(call: ThemeCall, scope: Scope, inventory: Inventory): Issue[] {
  return [
    ...runRules(briefRules, { brief: call.brief, scope }),
    ...runRules(callRules, { call }),
    ...runRules(themeRules, { theme: buildTheme(call), inventory }),
  ];
}
