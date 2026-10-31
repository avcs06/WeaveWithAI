import type { Issue } from '../../../core/issues';
import { type Rule, runRules } from '../../../core/rules';
import type { DesignNode, Ia, Screens } from '../schema';
import {
  iaRule as design001Ia,
  nodesRule as design001Nodes,
} from './design-001-ids';
import { rule as design002 } from './design-002-sizes-looks';
import {
  iaRule as design003Ia,
  nodesRule as design003Nodes,
  screensRule as design003Screens,
} from './design-003-new-components-used';
import { rule as design004 } from './design-004-new-component-reasons';
import { rule as design005 } from './design-005-new-component-names';
import { rule as design006 } from './design-006-budget';
import { rule as design008 } from './design-008-steps-served';
import {
  iaRule as design009Ia,
  screensRule as design009Screens,
} from './design-009-ids-covered';
import { rule as design010 } from './design-010-fields';
import { rule as design011 } from './design-011-states';
import { rule as design012 } from './design-012-primary-actions';
import {
  iaRule as design013Ia,
  nodesRule as design013Nodes,
} from './design-013-hero';
import {
  iaRule as design014Ia,
  nodesRule as design014Nodes,
} from './design-014-size';
import { rule as design015 } from './design-015-headings';
import { rule as design016 } from './design-016-control-names';
import { rule as design017 } from './design-017-reachable';
import { rule as design018 } from './design-018-access';
import { rule as design019 } from './design-019-data';
import { rule as design020 } from './design-020-copy';
import { rule as design021 } from './design-021-serves-steps';
import {
  iaRule as design022Ia,
  nodesRule as design022Nodes,
} from './design-022-grid-columns';
import { rule as design023 } from './design-023-shells';
import { rule as design024 } from './design-024-regions-filled';
import { rule as design025 } from './design-025-navigation-drawn';
import { rule as design026 } from './design-026-interactive-components';
import { rule as design027 } from './design-027-override-reasons';
import { rule as design034 } from './design-034-navigation-target';
import { rule as design035 } from './design-035-way-back';
import type {
  DesignContext,
  IaInput,
  NodesInput,
  ScreensInput,
} from './helpers';

// The DESIGN rules the design agents share, one file per rule in this folder.
// To add a rule: create its file, import it here, add it to its list.

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
