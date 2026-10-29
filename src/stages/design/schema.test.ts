import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { toJsonSchema } from '../../core/schema';
import { keysOf } from '../../core/utils';
import type { Inventory } from '../../ds/inventory';
import { makeScreensSchema } from './schema';

const inventory = JSON.parse(
  readFileSync(
    new URL('../../ds/__fixtures__/inventory.json', import.meta.url),
    'utf8',
  ),
) as Inventory;
const schemas = makeScreensSchema(inventory);

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
    ['Ia', schemas.Ia],
    ['ScreenNodes', schemas.ScreenNodes],
  ])('%s converts within the API limits', (name, schema) => {
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

  it('a new component carries its boxes and the prose the coding agent builds from', () => {
    const { schema } = toJsonSchema(schemas.NewComponent, 'NewComponent');
    expect(schema.required).toEqual(
      expect.arrayContaining([
        'box',
        'parts',
        'layout',
        'behavior',
        'closestExisting',
        'keyboard',
        'ariaPattern',
      ]),
    );
    const parts = (schema.properties as Record<string, { items: { required: string[] } }>).parts;
    expect(parts?.items.required).toEqual(['name', 'description', 'box']);
  });
});
