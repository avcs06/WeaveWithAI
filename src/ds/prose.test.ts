import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Inventory } from './inventory';
import { inventoryProse } from './prose';

const fixture = JSON.parse(
  readFileSync(new URL('./__fixtures__/inventory.json', import.meta.url), 'utf8'),
) as Inventory;
const prose = inventoryProse(fixture);
const lines = prose.split('\n');

describe('inventoryProse', () => {
  it('opens one block per component, subcomponents indented under their category', () => {
    for (const component of fixture.components) {
      const own = lines.filter((line) =>
        new RegExp(`^(  )?${component.name.replace('.', '\\.')}: `).test(line),
      );
      expect(own, component.name).toHaveLength(1);
    }
    expect(prose).toMatch(/^Button: An action the user takes/m);
    expect(prose).toMatch(/^  IconButton: /m);
    expect(prose).toMatch(/^Toast: A short message after an action/m);
  });

  it('states variants with defaults, looks, slots, contents and boxes on short lines', () => {
    expect(prose).toContain(
      'Variants: size sm|md|icon-xs|icon-sm|icon-md (default sm); variant base|default|danger (default default).',
    );
    expect(prose).toContain('Looks: ghost, rounded, rounded ghost; default none.');
    expect(prose).toContain('Looks: outline (default), outline ghost,');
    expect(prose).toContain('Shows: title, description, content, footer actions, trigger button.');
    expect(prose).toContain('Contains: Tab.');
    expect(prose).toContain('Boxes: sm 32 tall, md 40 tall.');
    expect(prose).toContain('Boxes: xs 24 square, sm 32 square, md 40 square.');
    expect(prose).toContain('sm box 80 tall, at least 32');
    expect(prose).toContain('Boxes: 30 tall.');
  });

  it('stays small enough for a prompt', () => {
    expect(Buffer.byteLength(prose)).toBeLessThan(12 * 1024);
  });
});
