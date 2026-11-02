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

  it('states variants with defaults and looks on short lines, and no props or recipe contents', () => {
    expect(prose).toContain(
      'Variants: size sm|md|icon-xs|icon-sm|icon-md (default sm); variant base|default|danger (default default).',
    );
    expect(prose).toContain('Looks: ghost, rounded, rounded ghost; default none.');
    expect(prose).toContain('Looks: outline (default), outline ghost,');
    expect(prose).not.toMatch(/^\s*(Shows|Contains):/m);
  });

  it('states the heights of Button alone', () => {
    expect(prose).toContain(
      [
        'Button: An action the user takes: submit a form, save, publish, delete, open a menu.',
        '  Variants: size sm|md|icon-xs|icon-sm|icon-md (default sm); variant base|default|danger (default default).',
        '  Looks: ghost, rounded, rounded ghost; default none.',
        '  Heights: sm 32, md 40.',
      ].join('\n'),
    );
    expect(prose.match(/Heights: /g)).toHaveLength(1);
  });

  it('stays small enough for a prompt', () => {
    expect(Buffer.byteLength(prose)).toBeLessThan(12 * 1024);
  });
});
