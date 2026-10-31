import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Theme } from '../../01theme/build';
import { SHELL_IDS } from '../../01theme/shells';
import { planAsIa, type Processed as Plan } from '../../02architect/process';
import { AS_WRITTEN, designNode } from '../../08assemble/nodes';
import { withDefaults } from '../../08assemble/resolve';
import { skeleton } from '../../08assemble/skeleton/skeleton';
import { layoutInput } from '../../08assemble/validation/helpers';
import { rule as layout071 } from '../../08assemble/validation/rules/layout-071-fixed-regions';
import { shellPage } from '../../08assemble/widget-page';
import { frameRule as design001 } from '../../rules/design-001-ids';
import { frameRule as design032 } from '../../rules/design-032-widget-serves';
import { rule as design042 } from '../../rules/design-042-shape-box';
import type { DesignContext, FrameInput } from '../../rules/helpers';
import { validateScreenNodes } from '../../rules/index';
import type { FrameBuild } from '../schema';

// A frame call's checks (DS23): its changes and the steps catalog gave it, the
// node rules on the shell's nodes and on what each change adds, and the fixed
// regions of the shell solved around an empty page.

export const frameRules: readonly Rule<FrameInput>[] = [design001, design032];

export function validateFrame(
  frame: FrameBuild,
  plan: Plan,
  frameSteps: string[],
  ctx: DesignContext,
  theme: Theme,
): Issue[] {
  const kind = frame.screen === SHELL_IDS.marketing ? 'marketing' : 'app';
  const nodes = [...frame.nodes, ...frame.changes.flatMap((c) => c.add)];
  const design = nodes.map((node) =>
    designNode(node, { id: node.id, section: node.section, parent: node.parent }, kind, AS_WRITTEN),
  );
  const shell = shellPage(kind, design.slice(0, frame.nodes.length), theme);
  return [
    ...runRules(frameRules, { frame, plan, frameSteps, ctx }),
    ...runRules([design042], { nodes }),
    ...validateScreenNodes(frame.screen, withDefaults(design, theme), planAsIa(plan), ctx),
    ...runRules([layout071], layoutInput(shell, skeleton(shell, ctx.inventory), ctx.inventory)),
  ];
}
