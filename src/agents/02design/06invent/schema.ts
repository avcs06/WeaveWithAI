import { z } from 'zod';
import type { Inventory } from '../../../ds/inventory';
import { makeScreensSchema } from '../schema';

/** A component call's shape: a declared component's design, without what the IA declared. */
export function makeInventSchemas(inv: Inventory) {
  const { NewComponent } = makeScreensSchema(inv);
  const ComponentDesign = NewComponent.omit({
    name: true,
    purpose: true,
    closestExisting: true,
    whyNotExisting: true,
    usedOn: true,
  });
  return { ComponentDesign };
}

export type ComponentDesign = z.infer<
  ReturnType<typeof makeInventSchemas>['ComponentDesign']
>;
