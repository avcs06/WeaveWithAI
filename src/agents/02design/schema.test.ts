import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { toJsonSchema } from '../../core/schema';
import { keysOf } from '../../core/utils';
import type { Inventory } from '../../ds/inventory';
import { Brief } from './01brief/schema';
import { makeScreensSchema } from './schema';
import { makeThemeSchema } from './02theme/schema';
import { patchSchema } from '../../runner/patch';
import { makeArchitectSchema, PLAN_KEYS } from './03architect/schema';
import { CATALOG_KEYS, makeCatalogSchema } from './04catalog/schema';
import { SCREEN_KEYS, ScreenLayouts } from './05screen/schema';
import { DESIGN_KEYS, makeInventSchemas } from './06invent/schema';
import { BUILD_KEYS, makeDrawSchemas } from './07draw/schema';
import { FRAME_KEYS, makeFrameSchemas } from './08frame/schema';

const inventory = JSON.parse(
  readFileSync(
    new URL('../../ds/__fixtures__/inventory.json', import.meta.url),
    'utf8',
  ),
) as Inventory;
const schemas = makeScreensSchema(inventory);
const brief = Brief.parse(
  JSON.parse(
    readFileSync(
      new URL('./__fixtures__/reading-list.brief.json', import.meta.url),
      'utf8',
    ),
  ),
);

const row = {
  direction: 'row',
  gap: '4',
  padding: '0',
  columns: 0,
  align: 'center',
  justify: 'between',
  wrap: false,
};
const node = (what: string, rest: Record<string, unknown> = {}) => ({
  id: 'S01.n01',
  section: 'S01.sec1',
  parent: '',
  order: 1,
  what,
  newComponent: '',
  component: 'none',
  size: '',
  look: '',
  overrideReason: '',
  layout: null,
  box: {
    width: 'content',
    widthPx: 0,
    height: 'content',
    heightPx: 0,
    minHeightPx: 0,
    span: 1,
  },
  typeScale: 'none',
  text: 'Save',
  label: '',
  headingLevel: 0,
  role: 'primary-action',
  field: '',
  data: [],
  flowSteps: ['F01.S01'],
  states: ['default'],
  navigatesTo: '',
  ...rest,
});

describe('screens schemas', () => {
  it.each([
    ['Brief', Brief],
    ['Theme', makeThemeSchema(brief, inventory)],
    ['Ia', schemas.Ia],
    ['ScreenNodes', schemas.ScreenNodes],
    ...(
      [
        ['Plan', makeArchitectSchema(inventory).Plan, PLAN_KEYS],
        ['Catalog', makeCatalogSchema(inventory).Catalog, CATALOG_KEYS],
        ['ScreenLayouts', ScreenLayouts, SCREEN_KEYS],
        ['ComponentDesign', makeInventSchemas(inventory).ComponentDesign, DESIGN_KEYS],
        ['Build', makeDrawSchemas(inventory).Build, BUILD_KEYS],
        ['FrameBuild', makeFrameSchemas(inventory).FrameBuild, FRAME_KEYS],
      ] as const
    ).flatMap(([name, schema, keys]) => [
      [name, schema],
      [`${name}Patch`, patchSchema(schema, keys)],
    ]),
  ] as [string, Parameters<typeof toJsonSchema>[0]][])('%s converts within the API limits', (name, schema) => {
    const bridged = toJsonSchema(schema, name);
    expect(bridged.stats.depth).toBeLessThanOrEqual(8);
    expect(keysOf(bridged.schema)).not.toContain('oneOf');
    expect(bridged.schema).not.toHaveProperty('$schema');
  });

  it('describes a node in prose and takes only spacing keys and type sizes the inventory has', () => {
    const parses = (value: unknown) => schemas.Node.safeParse(value).success;
    expect(parses(node('a primary button'))).toBe(true);
    expect(parses(node('a primary button', { component: 'Button', size: 'md', look: 'ghost' }))).toBe(true);
    expect(parses(node('a primary button', { component: 'PageLayout' }))).toBe(false);
    expect(parses(node('a primary button', { component: 'Button', size: 'huge' }))).toBe(false);
    expect(parses(node('a password input, size md', { role: 'input', field: 'password' }))).toBe(true);
    expect(parses(node('a row of actions', { role: 'container', layout: row }))).toBe(true);
    expect(parses(node('a row of actions', { role: 'container', layout: { ...row, gap: '7.25' } }))).toBe(false);
    const heading = { typeScale: 'title', headingLevel: 1, role: 'heading' };
    expect(parses(node('the page title', heading))).toBe(true);
    expect(parses(node('the page title', { ...heading, typeScale: 'huge' }))).toBe(false);
  });

  it('a new component carries its look and no behavior: the coding stage gives it that', () => {
    const { schema } = toJsonSchema(schemas.NewComponent, 'NewComponent');
    expect(schema.required).toEqual(
      expect.arrayContaining(['description', 'minWidthPx', 'maxWidthPx', 'box', 'layout', 'nodes', 'closestExisting']),
    );
    for (const gone of ['behavior', 'keyboard', 'ariaPattern', 'parts']) expect(schema.required).not.toContain(gone);
  });
});
