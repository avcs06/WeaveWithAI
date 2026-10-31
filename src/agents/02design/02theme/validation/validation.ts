import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Inventory } from '../../../../ds/inventory';
import type { Theme } from '../build';
import type { ThemeInput } from './helpers';
import { rule as theme001 } from './rules/theme-001-text-contrast';
import { rule as theme002 } from './rules/theme-002-edge-contrast';
import { rule as theme004 } from './rules/theme-004-fonts-radius-ring';
import { rule as theme005 } from './rules/theme-005-hex';
import { rule as theme006 } from './rules/theme-006-layouts';
import { rule as theme007 } from './rules/theme-007-frame-spacing';
import { rule as theme008 } from './rules/theme-008-semantic-defaults';
import { rule as theme009 } from './rules/theme-009-quiet-colors';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

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

export function validateTheme(theme: Theme, inventory: Inventory): Issue[] {
  return runRules(themeRules, { theme, inventory });
}
