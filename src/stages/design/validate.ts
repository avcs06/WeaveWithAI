// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.
import type { Issue } from '../../core/issues';
import { type Rule, runRules } from '../../core/rules';
import type { Inventory } from '../../ds/inventory';
import type { Scope } from '../flows/schema';
import type { Skeleton } from './layout';
import {
  iaRule as design001Ia,
  nodesRule as design001Nodes,
} from './rules/design-001-ids';
import { rule as design002 } from './rules/design-002-sizes-looks';
import {
  iaRule as design003Ia,
  nodesRule as design003Nodes,
  screensRule as design003Screens,
} from './rules/design-003-new-components-used';
import { rule as design004 } from './rules/design-004-new-component-reasons';
import { rule as design005 } from './rules/design-005-new-component-names';
import { rule as design006 } from './rules/design-006-budget';
import { rule as design008 } from './rules/design-008-steps-served';
import {
  iaRule as design009Ia,
  screensRule as design009Screens,
} from './rules/design-009-ids-covered';
import { rule as design010 } from './rules/design-010-fields';
import { rule as design011 } from './rules/design-011-states';
import { rule as design012 } from './rules/design-012-primary-actions';
import {
  iaRule as design013Ia,
  nodesRule as design013Nodes,
} from './rules/design-013-hero';
import {
  iaRule as design014Ia,
  nodesRule as design014Nodes,
} from './rules/design-014-size';
import { rule as design015 } from './rules/design-015-headings';
import { rule as design016 } from './rules/design-016-control-names';
import { rule as design017 } from './rules/design-017-reachable';
import { rule as design018 } from './rules/design-018-access';
import { rule as design019 } from './rules/design-019-data';
import { rule as design020 } from './rules/design-020-copy';
import { rule as design021 } from './rules/design-021-serves-steps';
import {
  iaRule as design022Ia,
  nodesRule as design022Nodes,
} from './rules/design-022-grid-columns';
import { rule as design023 } from './rules/design-023-shells';
import { rule as design024 } from './rules/design-024-regions-filled';
import { rule as design025 } from './rules/design-025-navigation-drawn';
import { rule as design026 } from './rules/design-026-interactive-components';
import { rule as design027 } from './rules/design-027-override-reasons';
import { rule as design034 } from './rules/design-034-navigation-target';
import { rule as design035 } from './rules/design-035-way-back';
import { rule as brief001 } from './rules/brief-001-ranges';
import { rule as brief002 } from './rules/brief-002-entities';
import { rule as brief003 } from './rules/brief-003-hues-apart';
import type { BriefInput } from './rules/brief-helpers';
import { rule as theme001 } from './rules/theme-001-text-contrast';
import { rule as theme002 } from './rules/theme-002-edge-contrast';
import { rule as theme004 } from './rules/theme-004-fonts-radius-ring';
import { rule as theme005 } from './rules/theme-005-hex';
import { rule as theme006 } from './rules/theme-006-layouts';
import { rule as theme007 } from './rules/theme-007-frame-spacing';
import { rule as theme008 } from './rules/theme-008-semantic-defaults';
import { rule as theme009 } from './rules/theme-009-quiet-colors';
import type { ThemeInput } from './rules/theme-helpers';
import type { Theme } from './theme';
import {
  type DesignContext,
  type IaInput,
  type NodesInput,
  type ScreensInput,
} from './rules/design-helpers';
import { rule as layout001 } from './rules/layout-001-gaps-shrink';
import { rule as layout002 } from './rules/layout-002-heading-belongs';
import { rule as layout003 } from './rules/layout-003-related-pairs';
import { rule as layout004 } from './rules/layout-004-icon-text';
import { rule as layout005 } from './rules/layout-005-groups-apart';
import { rule as layout006 } from './rules/layout-006-padding-over-gap';
import { rule as layout008 } from './rules/layout-008-section-gaps';
import { rule as layout009 } from './rules/layout-009-form-spacing';
import { rule as layout010 } from './rules/layout-010-row-rhythm';
import { rule as layout011 } from './rules/layout-011-button-groups';
import { rule as layout012 } from './rules/layout-012-title-description';
import { rule as layout013 } from './rules/layout-013-paragraphs';
import { rule as layout014 } from './rules/layout-014-negative-space';
import { rule as layout015 } from './rules/layout-015-left-edges';
import { rule as layout018 } from './rules/layout-018-one-size';
import { rule as layout019 } from './rules/layout-019-centre-blocks';
import { rule as layout020 } from './rules/layout-020-even-grids';
import { rule as layout025 } from './rules/layout-025-measure';
import { rule as layout026 } from './rules/layout-026-min-widths';
import { rule as layout028 } from './rules/layout-028-first-viewport';
import { rule as layout030 } from './rules/layout-030-media-ratios';
import { rule as layout031 } from './rules/layout-031-heading-sizes';
import { rule as layout035 } from './rules/layout-035-empty-states';
import { rule as layout038 } from './rules/layout-038-cards-for-sets';
import { rule as layout039 } from './rules/layout-039-no-box-in-box';
import { rule as layout046 } from './rules/layout-046-viewport-width';
import { rule as layout050 } from './rules/layout-050-short-labels';
import { rule as layout055 } from './rules/layout-055-row-actions';
import { rule as layout060 } from './rules/layout-060-page-action';
import { rule as layout063 } from './rules/layout-063-confirmations';
import { rule as layout065 } from './rules/layout-065-state-places';
import { rule as layout066 } from './rules/layout-066-focus-room';
import { rule as layout067 } from './rules/layout-067-ghost-text';
import { rule as layout070 } from './rules/layout-070-overlay-clear';
import { rule as layout071 } from './rules/layout-071-fixed-regions';
import { type LayoutInput, layoutInput } from './rules/layout-helpers';
import type { Brief, DesignNode, Ia, Screens } from './schema';

export type { DesignContext };

export const briefRules: readonly Rule<BriefInput>[] = [
  brief001,
  brief002,
  brief003,
];

export function validateBrief(brief: Brief, scope: Scope): Issue[] {
  return runRules(briefRules, { brief, scope });
}

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

/** Rules on the IA alone: structure, new components, access, reach of the frame. */
export const iaRules: readonly Rule<IaInput>[] = [
  design001Ia,
  design003Ia,
  design004,
  design005,
  design006,
  design009Ia,
  design013Ia,
  design014Ia,
  design018,
  design021,
  design022Ia,
  design023,
];

/** Rules on one screen's nodes, for fast feedback per call. */
export const nodeRules: readonly Rule<NodesInput>[] = [
  design001Nodes,
  design002,
  design003Nodes,
  design011,
  design012,
  design013Nodes,
  design014Nodes,
  design015,
  design016,
  design019,
  design020,
  design022Nodes,
  design026,
  design027,
  design034,
  design035,
];

/** Rules that need every screen: coverage of the flows, reachability, use of new components. */
export const screensRules: readonly Rule<ScreensInput>[] = [
  design003Screens,
  design008,
  design009Screens,
  design010,
  design017,
  design024,
  design025,
];

/** The layout heuristics (specs/layout-heuristics.md) on the skeleton, LAYOUT-0NN for H-NN. */
export const layoutRules: readonly Rule<LayoutInput>[] = [
  layout001,
  layout002,
  layout003,
  layout004,
  layout005,
  layout006,
  layout008,
  layout009,
  layout010,
  layout011,
  layout012,
  layout013,
  layout014,
  layout015,
  layout018,
  layout019,
  layout020,
  layout025,
  layout026,
  layout028,
  layout030,
  layout031,
  layout035,
  layout038,
  layout039,
  layout046,
  layout050,
  layout055,
  layout060,
  layout063,
  layout065,
  layout066,
  layout067,
  layout070,
  layout071,
];

export function validateIa(ia: Ia, ctx: DesignContext): Issue[] {
  return runRules(iaRules, { ia, ctx });
}

/** One nodes call's output: the nodes it wrote for `screen`, a screen or a shell. */
export function validateScreenNodes(
  screen: string,
  nodes: DesignNode[],
  ia: Ia,
  ctx: DesignContext,
): Issue[] {
  return runRules(nodeRules, { nodes, ia, ctx, screen });
}

export function validateScreens(screens: Screens, ctx: DesignContext): Issue[] {
  return runRules(screensRules, { screens, ctx });
}

/** Every layout rule on a solved skeleton. */
export function validateLayout(
  screens: Screens,
  skeleton: Skeleton,
  inventory: Inventory,
): Issue[] {
  return runRules(layoutRules, layoutInput(screens, skeleton, inventory));
}
