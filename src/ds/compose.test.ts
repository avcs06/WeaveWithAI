import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { composition } from './compose';
import type { Inventory } from './inventory';

const fixture = JSON.parse(
  readFileSync(new URL('./__fixtures__/inventory.json', import.meta.url), 'utf8'),
) as Inventory;
const contains = composition(
  'template',
  fixture.components.map((component) => component.name),
);

describe('composition from the template recipes', () => {
  it('finds the parts that belong to a component by name', () => {
    expect(contains.Tabs).toEqual(['Tab']);
    expect(contains.Select).toEqual(['SelectGroup', 'SelectOption']);
    expect(contains.MultiSelect).toContain('SelectOption');
    expect(contains.RadioGroup).toEqual(['Radio']);
    expect(contains.Accordion).toEqual(['Accordion.Item']);
    expect(contains.Table).toEqual(expect.arrayContaining(['Table.Column', 'Table.Pagination']));
    expect(contains.Dropdown).toEqual(expect.arrayContaining(['Dropdown.Item', 'Dropdown.Group']));
  });

  it('ignores content a component merely wraps', () => {
    expect(contains.Dialog).toBeUndefined();
    expect(contains.Section).toBeUndefined();
    expect(contains.Tab).toBeUndefined();
    expect(contains.Card).toBeUndefined();
  });
});
