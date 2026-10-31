import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Inventory } from '../../../../ds/inventory';
import type { DesignContext } from '../../rules/helpers';
import {
  validateIa,
  validateScreenNodes,
  validateScreens,
} from '../../rules/index';
import type { Screens } from '../../schema';
import { skeleton, type Skeleton } from '../skeleton/skeleton';
import { layoutInput, type LayoutInput } from './helpers';
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

// One file per rule in ./rules. To add a rule: create its file, import it here, add it to its list.

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

/** Every layout rule on a solved skeleton. */
export function validateLayout(
  screens: Screens,
  skeleton: Skeleton,
  inventory: Inventory,
): Issue[] {
  return runRules(layoutRules, layoutInput(screens, skeleton, inventory));
}

/** The assembled design: the IA, each screen's and shell's nodes, the whole artifact and its solved layout. */
export function validateDesign(
  screens: Screens,
  solved: ReturnType<typeof skeleton>,
  ctx: DesignContext,
): Issue[] {
  const { nodes, shells, containers: _containers, ...ia } = screens;
  const owner = (section: string) =>
    ia.sections.find((s) => s.id === section)?.screen ??
    shells.find((shell) => shell.regions.some((r) => r.id === section))?.id;
  return [
    ...validateIa(ia, ctx),
    ...[...ia.screens, ...shells].flatMap(({ id }) =>
      validateScreenNodes(
        id,
        nodes.filter((node) => owner(node.section) === id),
        ia,
        ctx,
      ),
    ),
    ...validateScreens(screens, ctx),
    ...validateLayout(screens, solved, ctx.inventory),
  ];
}
