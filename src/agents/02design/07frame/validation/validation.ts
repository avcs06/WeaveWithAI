import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Theme } from '../../01theme/build';
import { SHELL_IDS } from '../../01theme/shells';
import { planAsIa, type Processed as Plan } from '../../02architect/process';
import { AS_WRITTEN, designNode } from '../../08assemble/nodes';
import { withDefaults } from '../../08assemble/resolve';
import { frameRule as design001 } from '../../rules/design-001-ids';
import { frameRule as design032 } from '../../rules/design-032-widget-serves';
import { rule as design042 } from '../../rules/design-042-shape-box';
import type { DesignContext, FrameInput } from '../../rules/helpers';
import { validateScreenNodes } from '../../rules/index';
import type { FrameBuild } from '../schema';

// A frame call's checks (DS23): its changes and the steps catalog gave it, and
// the node rules on the shell's nodes and on what each change adds.

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
  return [
    ...runRules(frameRules, { frame, plan, frameSteps, ctx }),
    ...runRules([design042], { nodes }),
    ...validateScreenNodes(frame.screen, withDefaults(design, theme), planAsIa(plan), ctx),
  ];
}
