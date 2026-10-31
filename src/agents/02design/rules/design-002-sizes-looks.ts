import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { NodesInput } from './helpers';

/**
 * DESIGN-002 · mandatory
 * A node's size is one of its component's sizes and its look one of its looks,
 * or base for the design system's plain look.
 * A component's own height is the design system's: the skeleton takes it from
 * the inventory and nothing checks the node's.
 * Pass: a Button, size md, look ghost.
 * Fail: a Button, size lg.
 */
export const rule = defineRule<NodesInput>(
  'DESIGN-002',
  'mandatory',
  ({ nodes, ctx }, fail) => {
    const issues: Issue[] = [];
    const components = new Map(
      ctx.inventory.components.map((c) => [c.name, c]),
    );
    for (const node of nodes) {
      const component = components.get(node.component);
      if (!component) {
        if (node.size || node.look)
          issues.push(
            fail(
              `${node.id} has size "${node.size}" and look "${node.look}" but no design-system component; leave both "".`,
              node.id,
            ),
          );
        continue;
      }
      const sizes = component.variants.size ?? [];
      if (node.size && !sizes.includes(node.size))
        issues.push(
          fail(
            `${node.id} is a ${component.name} of size ${node.size}; its sizes are ${sizes.join(', ') || 'none'}.`,
            node.id,
          ),
        );
      const looks = component.looks ?? [];
      if (node.look && node.look !== 'base' && !looks.includes(node.look))
        issues.push(
          fail(
            `${node.id} is a ${component.name} with look "${node.look}"; its looks are ${looks.filter(Boolean).join(', ') || 'none'}.`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
