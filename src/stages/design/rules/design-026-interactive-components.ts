import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { INTERACTIVE, type NodesInput } from './design-helpers';

/**
 * DESIGN-026 · mandatory
 * An action, a navigation or an input is a design-system component or a
 * declared new component; `none` is for text, headings, media and layout boxes.
 * Pass: the Save book Button.
 * Fail: the Save book action with component none and no new component.
 */
export const rule = defineRule<NodesInput>(
  'DESIGN-026',
  'mandatory',
  ({ nodes }, fail) => {
    const issues: Issue[] = [];
    for (const node of nodes)
      if (
        INTERACTIVE.has(node.role) &&
        node.component === 'none' &&
        !node.newComponent
      )
        issues.push(
          fail(
            `${node.id} is a ${node.role} with no component; name the design-system component it is, or declare a new component in the IA and name it.`,
            node.id,
          ),
        );
    return issues;
  },
);
