import type { Issue } from '../../../../core/issues';
import { type Rule, runRules } from '../../../../core/rules';
import type { Theme } from '../../02theme/build';
import { SHELL_IDS } from '../../02theme/shells';
import type { WidgetIa } from '../../03architect/schema';
import { legacyIa } from '../../09assemble/assemble';
import { copyText, designNode } from '../../09assemble/nodes';
import { withDefaults } from '../../09assemble/resolve';
import { frameRule as design028Frame } from '../../rules/design-028-copy';
import type { DesignContext, FrameInput } from '../../rules/helpers';
import { validateScreenNodes } from '../../rules/index';
import type { FrameBuild } from '../schema';

// A frame call's checks (DS23): the copy rule and the node rules on the shell.

export const frameRules: readonly Rule<FrameInput>[] = [design028Frame];

/** One frame call's nodes for a shell: the copy rule and the node rules. */
export function validateFrame(
  frame: FrameBuild,
  ia: WidgetIa,
  ctx: DesignContext,
  theme: Theme,
): Issue[] {
  const text = copyText([...ia.copy, ...frame.copy]);
  const kind = frame.screen === SHELL_IDS.marketing ? 'marketing' : 'app';
  const nodes = frame.nodes.map((node) =>
    designNode(
      node,
      { id: node.id, section: node.section, parent: node.parent },
      kind,
      text,
    ),
  );
  return [
    ...runRules(frameRules, { frame, ia, ctx }),
    ...validateScreenNodes(
      frame.screen,
      withDefaults(nodes, theme),
      legacyIa(ia),
      ctx,
    ),
  ];
}
