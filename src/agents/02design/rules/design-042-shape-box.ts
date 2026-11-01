import { defineRule } from '../../../core/rules';
import type { ModelNodesInput } from './helpers';

/**
 * DESIGN-042 · mandatory
 * A shape node draws a visual no component expresses, such as a progress ring;
 * it has no content to size it, so its box is fixed or fill in
 * both directions.
 * Pass: a ring fixed 48 by 48.
 * Fail: a ring as wide as its content.
 */
export const rule = defineRule<ModelNodesInput>(
  'DESIGN-042',
  'mandatory',
  ({ nodes }, fail) =>
    nodes
      .filter((n) => n.role === 'shape' && (n.box.width === 'content' || n.box.height === 'content'))
      .map((n) => fail(`${n.id} is a shape with width ${n.box.width} and height ${n.box.height}. A shape has no content to size it, so its box is fixed or fill in both directions. Set the ${[n.box.width === 'content' ? 'width' : '', n.box.height === 'content' ? 'height' : ''].filter(Boolean).join(' and ')} of ${n.id} to fixed or fill.`, n.id)),
);
