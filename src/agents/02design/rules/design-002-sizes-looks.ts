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
              `${node.id} has size "${node.size}" and look "${node.look}", but its component ${node.component} is not a design-system component. Only a design-system component takes a size and a look. Give ${node.id} size "" and look "".`,
              node.id,
            ),
          );
        continue;
      }
      const sizes = component.variants.size ?? [];
      if (node.size && !sizes.includes(node.size))
        issues.push(
          fail(
            `${node.id} is a ${component.name} of size ${node.size}, which ${component.name} does not have. A node's size is one of its component's sizes. ${sizes.length ? `The sizes of ${component.name} are ${sizes.join(', ')}. Give ${node.id} one of those, or "" for the app's default.` : `${component.name} has no sizes. Give ${node.id} size "".`}`,
            node.id,
          ),
        );
      const looks = component.looks ?? [];
      if (node.look && node.look !== 'base' && !looks.includes(node.look))
        issues.push(
          fail(
            `${node.id} is a ${component.name} with look "${node.look}", which ${component.name} does not have. A node's look is one of its component's looks, or base for the design system's plain look. ${looks.some(Boolean) ? `The looks of ${component.name} are ${looks.filter(Boolean).join(', ')}. Give ${node.id} one of those, base, or "" for the app's default.` : `${component.name} has no looks. Give ${node.id} look base, or "" for the app's default.`}`,
            node.id,
          ),
        );
    }
    return issues;
  },
);
