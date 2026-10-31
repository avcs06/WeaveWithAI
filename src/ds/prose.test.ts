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
    expect(prose).toContain('Boxes: sm 32 tall, padding 6 8, gap 8; md 40 tall, padding 8 12, gap 10.');
    expect(prose).toContain('Boxes: xs 24 square, padding 4; sm 32 square, padding 7; md 40 square, padding 8.');
    expect(prose).toContain('sm box 80 tall, at least 32, padding 8 16, gap 8');
    expect(prose).toContain('Boxes: 30 tall, padding 8 10, gap 10.');
    expect(prose).toContain('Boxes: padding 16 20, gap 12.');
    expect(prose).toContain('Boxes: padding 20, gap 20; header 52 tall, gap 4; content gap 16.');
    expect(prose).toContain('md body 520 wide, padding 20 24 24 24;');
  });

  it('says a state\'s part once when it equals the part without the state', () => {
    expect(prose).toContain('sm with error 104 tall, gap 8; sm with error message 16 tall, padding 0 4;');
    expect(prose).not.toContain('sm with error box');
  });

  it('stays small enough for a prompt', () => {
    expect(Buffer.byteLength(prose)).toBeLessThan(12 * 1024);
  });
});
