import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { IaInput, NodesInput, ScreensInput } from './design-helpers';

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
              `${component.name} is used on ${component.usedOn.join(', ') || 'no screen'}; list the screens or shells that use it.`,
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
              `${node.id} is a ${node.newComponent}, which is not declared in newComponents; declare it or use a design-system component.`,
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
            `${component.name} is declared but no node is one; use it or drop it.`,
            component.name,
          ),
        );
    return issues;
  },
);
