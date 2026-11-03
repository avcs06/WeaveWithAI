import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Inventory } from '../../../../ds/inventory';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import { buildTheme } from '../build';
import type { ThemeCall } from '../schema';
import type {
  BriefInput,
  CallInput,
  LayoutsInput,
  ThemeInput,
} from './helpers';
import { rule as brief001 } from './rules/brief-001-ranges';
import { rule as brief002 } from './rules/brief-002-entities';
import { rule as brief003 } from './rules/brief-003-hues-apart';
import { rule as brief005 } from './rules/brief-005-font-candidates';
import { rule as brief007 } from './rules/brief-007-status-hues';
import { rule as theme001 } from './rules/theme-001-text-contrast';
import { rule as theme002 } from './rules/theme-002-edge-contrast';
import { rule as theme004 } from './rules/theme-004-fonts-radius-ring';
import { rule as theme005 } from './rules/theme-005-hex';
import { rule as theme006 } from './rules/theme-006-layouts';
import { rule as theme007 } from './rules/theme-007-frame-spacing';
import { rule as theme008 } from './rules/theme-008-semantic-defaults';
import { rule as theme009 } from './rules/theme-009-quiet-colors';
import { rule as theme010 } from './rules/theme-010-modes-entities';
import { rule as theme011 } from './rules/theme-011-logo';
import { rule as theme012 } from './rules/theme-012-shadow';
import { rule as theme013 } from './rules/theme-013-slot-trace';
import { rule as theme014 } from './rules/theme-014-background-visible';

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

export const briefRules: readonly Rule<BriefInput>[] = [
  brief001,
  brief002,
  brief003,
  brief005,
  brief007,
];

export const callRules: readonly Rule<CallInput>[] = [theme010, theme012];

/** The page layouts against the scope and the flows; `weave validate` runs them too. */
export const layoutRules: readonly Rule<LayoutsInput>[] = [theme013];

/** THEME-003 checks an applied app, so the scaffold stage runs it. */
export const themeRules: readonly Rule<ThemeInput>[] = [
  theme001,
  theme002,
  theme004,
  theme005,
  theme006,
  theme007,
  theme008,
  theme009,
  theme011,
  theme014,
];

/** The theme call's answer: the brief against the scope, the layouts against the scope and flows, the colors against the brief, and the theme they build. */
export function validateTheme(
  call: ThemeCall,
  scope: Scope,
  flows: Flows,
  inventory: Inventory,
): Issue[] {
  const theme = buildTheme(call);
  return [
    ...runRules(briefRules, { brief: call.brief, scope }),
    ...runRules(layoutRules, { layouts: theme.layouts, scope, flows }),
    ...runRules(callRules, { call }),
    ...runRules(themeRules, { theme, inventory }),
  ];
}
