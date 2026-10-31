import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { NodeLayout } from '../schema';
import type { IaInput, NodesInput } from './design-helpers';

/**
 * DESIGN-022 · mandatory
 * A grid has 1 to 4 columns; rows and columns have 0.
 * Pass: the feature grid with 3.
 * Fail: the feature grid with 5.
 */
const wrong = (layout: NodeLayout | null) =>
  layout &&
  (layout.direction === 'grid'
    ? layout.columns < 1 || layout.columns > 4
    : layout.columns !== 0);
const say = (id: string, layout: NodeLayout) =>
  `${id} is a ${layout.direction} with ${layout.columns} columns; a grid has 1 to 4, a row or column 0.`;

export const iaRule = defineRule<IaInput>(
  'DESIGN-022',
  'mandatory',
  ({ ia }, fail) =>
    [...ia.screens, ...ia.sections].flatMap((x) =>
      wrong(x.layout) ? [fail(say(x.id, x.layout), x.id)] : [],
    ),
);

export const nodesRule = defineRule<NodesInput>(
  'DESIGN-022',
  'mandatory',
  ({ nodes }, fail) =>
    nodes.flatMap((node) =>
      node.layout && wrong(node.layout)
        ? [fail(say(node.id, node.layout), node.id)]
        : [],
    ),
);
