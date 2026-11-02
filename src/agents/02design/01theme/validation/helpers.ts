import type { Inventory } from '../../../../ds/inventory';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Theme } from '../build';
import type { Brief, ThemeCall } from '../schema';

export type BriefInput = { brief: Brief; scope: Scope };
export type CallInput = { call: ThemeCall };
export type ThemeInput = { theme: Theme; inventory: Inventory };

/** A spacing key's pixels from the inventory's `spacing.<key>` token; 0 when it has none. */
export const spacingPx =
  (inventory: Inventory) =>
  (key: string): number =>
    Number.parseFloat(
      inventory.tokens.find((token) => token.name === `spacing.${key}`)
        ?.value ?? '',
    ) || 0;
