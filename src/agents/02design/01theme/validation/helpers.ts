import type { Inventory } from '../../../../ds/inventory';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Theme } from '../build';
import type { Brief, ThemeCall } from '../schema';

export type BriefInput = { brief: Brief; scope: Scope };
export type CallInput = { call: ThemeCall };
export type ThemeInput = { theme: Theme; inventory: Inventory };
