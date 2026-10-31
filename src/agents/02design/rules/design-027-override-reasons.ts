import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { NodesInput } from './helpers';

/**
 * DESIGN-027 · mandatory
 * The theme's defaults hold everywhere; a node whose size or look differs
 * from its component's default says why in `overrideReason`.
 * Pass: the top bar's Shelf button, ghost, because navigation there reads as a link.
 * Fail: the same button ghost with no reason.
 */
export const rule = defineRule<NodesInput>(
  'DESIGN-027',
  'mandatory',
  ({ nodes, ctx }, fail) => {
    const issues: Issue[] = [];
    for (const node of nodes) {
      const preset = ctx.defaults[node.component] ?? {};
      const changed = (['size', 'look'] as const).filter(
        (prop) => prop in preset && node[prop] !== preset[prop],
      );
      if (changed.length > 0 && !node.overrideReason.trim())
        issues.push(
          fail(
            `${node.id} sets its own ${changed.map((p) => `${p} ${node[p] || '""'}`).join(' and ')}, with an empty overrideReason. The app's default for ${node.component} is ${changed.map((p) => `${p} ${preset[p] || '""'}`).join(' and ')}. A node uses the app's defaults, or says why it differs in overrideReason. Set ${changed.join(' and ')} "" on ${node.id} to use the default, or write in overrideReason why ${node.id} differs.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
