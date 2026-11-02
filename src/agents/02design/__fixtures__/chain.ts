import { readFileSync } from 'node:fs';
import type { Inventory } from '../../../ds/inventory';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import { buildTheme } from '../01theme/build';
import { makeThemeSchema } from '../01theme/schema';
import { Architecture } from '../02architect/schema';

// The reading-list design the tests share: the inventory, the scope and flows,
// the theme call with what it builds, and the architect's frames, screens and dialogs.

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
export const inventory = read('../../../ds/__fixtures__/inventory.json') as Inventory;
export const flows = read('../../01flows/__fixtures__/reading-list.flows.json') as Flows;
export const scope = read('../../01flows/__fixtures__/reading-list.scope.json') as Scope;
/** The reading-list theme call: the brief, and the values the theme is built from. */
export const themeCall = makeThemeSchema(inventory).parse(read('./reading-list.theme.json'));
export const brief = themeCall.brief;
export const theme = buildTheme(themeCall);
export const architecture = Architecture.parse(read('./reading-list.architecture.json'));
