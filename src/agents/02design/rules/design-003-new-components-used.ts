import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { IaInput, NodesInput, ScreensInput } from './helpers';

/**
 * DESIGN-003 · mandatory
 * Every node's newComponent is declared, and every declared component is used.
 * Pass: TitleCover declared, used on S06 by S06.n13.
 * Fail: S06.n13 says CoverArt, which is not declared.
 */
export const iaRule = defineRule<IaInput>(
  'DESIGN-003',
  'mandatory',
  ({ ia, ctx }, fail) => {
    const screens = new Set([
      ...ia.screens.map((s) => s.id),
      ...ctx.shells.map((s) => s.id),
    ]);
    return ia.newComponents.flatMap((component) =>
      component.usedOn.length && component.usedOn.every((id) => screens.has(id))
        ? []
        : [
            fail(
              `${component.name} is used on ${component.usedOn.join(', ') || 'no screen'}. The usedOn of a new component lists at least one screen or shell, and only ids of screens or shells. Set the usedOn of ${component.name} to the screens or shells that use it.`,
              component.name,
            ),
          ],
    );
  },
);

export const nodesRule = defineRule<NodesInput>(
  'DESIGN-003',
  'mandatory',
  ({ nodes, ia }, fail) => {
    const declared = new Set(ia.newComponents.map((c) => c.name));
    return nodes.flatMap((node) =>
      node.newComponent && !declared.has(node.newComponent)
        ? [
            fail(
              `${node.id} is a ${node.newComponent}, which is not a declared new component. A node's newComponent names a declared new component. The declared ones are ${[...declared].join(', ') || 'none'}. Set the newComponent of ${node.id} to one of those, or set it to "" and use a design-system component.`,
              node.id,
            ),
          ]
        : [],
    );
  },
);

export const screensRule = defineRule<ScreensInput>(
  'DESIGN-003',
  'mandatory',
  ({ screens }, fail) => {
    const used = new Set(screens.nodes.map((node) => node.newComponent));
    const issues: Issue[] = [];
    for (const component of screens.newComponents)
      if (!used.has(component.name))
        issues.push(
          fail(
            `${component.name} is declared, but no node is a ${component.name}. Every declared new component is used by a node. Set newComponent ${component.name} on the node that is one, or drop ${component.name} from newComponents.`,
            component.name,
          ),
        );
    return issues;
  },
);
