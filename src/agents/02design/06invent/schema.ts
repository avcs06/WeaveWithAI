import { z } from 'zod';
import type { Inventory } from '../../../ds/inventory';
import { makeDrawSchemas } from '../07draw/schema';
import { boxSchemas } from '../schema-boxes';

/** An invent call's shape: a new component's look as a root box, its layout and its nodes (DS23). */
export function makeInventSchemas(inv: Inventory) {
  const { ModelNode } = makeDrawSchemas(inv);
  const { ComponentBox, Layout } = boxSchemas(inv);
  const ComponentDesign = z.object({
    box: ComponentBox.describe('Its root box, inside its width range'),
    layout: Layout.describe('How its root arranges its nodes'),
    nodes: z.array(ModelNode),
  });
  return { ComponentDesign };
}

export type ComponentDesign = z.infer<
  ReturnType<typeof makeInventSchemas>['ComponentDesign']
>;

/** A design's keyed list, for patch fixes (F16). */
export const DESIGN_KEYS = { nodes: 'id' };
