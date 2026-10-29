import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import {
  dsNames,
  type Inventory,
  inventory,
  radiusKeys,
  spacingKeys,
  typeScaleKeys,
} from './inventory';

const fixturePath = fileURLToPath(
  new URL('./__fixtures__/inventory.json', import.meta.url),
);
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as Inventory;
const byName = Object.fromEntries(
  fixture.components.map((component) => [component.name, component]),
);

describe('inventory fixture', () => {
  it('names every design-system component, no web app or config component', () => {
    const names = dsNames(fixture);
    expect(names).toContain('Button');
    expect(names).toContain('Table');
    expect(names).toHaveLength(fixture.components.length);
    expect(names).not.toContain('PageLayout');
    expect(names).not.toContain('NextLink');
    expect(names).not.toContain('Table.Sort');
    expect(names).not.toContain('MenuItem');
    expect(names).not.toContain('UIRoot');
    expect(names).not.toContain('Controller');
    expect(names).not.toContain('CheckIcon');
  });

  it('keeps variants, defaults, looks, boxes, slots and contents per component', () => {
    expect(Object.keys(byName.Button ?? {}).sort()).toEqual([
      'box',
      'category',
      'defaults',
      'description',
      'looks',
      'name',
      'slots',
      'variants',
    ]);
    expect(byName.Button?.slots).toEqual(['label', 'icon']);
    expect(byName.Dialog?.slots).toEqual(
      expect.arrayContaining(['title', 'description', 'footer actions']),
    );
    expect(byName.Toast).toMatchObject({
      category: 'Toast',
      variants: { status: ['success', 'error', 'warning', 'info'] },
      defaults: { status: 'info' },
      slots: ['title', 'description', 'status', 'action'],
    });
    expect(byName.Tabs?.contains).toEqual(['Tab']);
    expect(byName.Accordion?.contains).toEqual(['Accordion.Item']);
    expect(byName.Button?.contains).toBeUndefined();
    expect(byName.Button?.variants).toEqual({
      size: expect.arrayContaining(['sm', 'md']),
      variant: expect.arrayContaining(['default', 'base', 'danger']),
    });
    expect(byName.Button?.looks).toEqual(['', 'ghost', 'rounded', 'rounded ghost']);
    expect(byName.Card?.looks).toHaveLength(8);
    expect(byName.Card?.looks?.[0]).toBe('outline');
    expect(byName.Input?.looks).toEqual(['outline', 'open']);
    expect(byName.Input?.defaults).toBeUndefined();
    expect(byName.Checkbox?.defaults).toEqual({ variant: 'default', size: 'sm' });
    expect(byName.Checkbox?.looks).toBeUndefined();
  });

  it('records the fixed box dimensions per size and part', () => {
    expect(byName.Button?.box?.sm).toEqual({ height: 32 });
    expect(byName.Button?.box?.md).toEqual({ height: 40 });
    expect(byName.Avatar?.box?.md).toEqual({ height: 36, width: 36 });
    expect(byName.Dialog?.box?.md).toEqual({ width: 520 });
    expect(byName.FormControl?.box?.['sm/box']?.height).toBe(32);
    expect(byName.FormControl?.box?.sm?.height).toBeGreaterThan(32);
    expect(byName.FormControl?.box?.['sm+error']?.height).toBeGreaterThan(
      byName.FormControl?.box?.sm?.height ?? 0,
    );
    expect(byName.Accordion?.box).toEqual({ header: { height: expect.any(Number) } });
    expect(byName.Collapsible?.box?.header?.height).toBeGreaterThan(24);
    expect(byName.Pagination?.box?.full).toEqual(byName.Pagination?.box?.minimal);
    expect(byName.SearchInput?.box?.sm).toEqual({ height: expect.any(Number) });
    expect(byName.Textarea?.box?.['sm/box']).toMatchObject({ minHeight: 32 });
    expect(byName.MultiSelect?.box?.['sm/box']).toEqual({ minHeight: 32 });
    expect(byName.SelectOption?.box?.default?.height).toBeGreaterThan(0);
    expect(byName.Pagination?.box?.full).toEqual({ height: expect.any(Number) });
    expect(byName.Card?.box).toBeUndefined();
  });

  it('lists spacing and radius keys, numeric ones in order', () => {
    expect(spacingKeys(fixture).slice(0, 4)).toEqual(['0', '0.25', '0.5', '0.75']);
    expect(spacingKeys(fixture)).toContain('4');
    expect(spacingKeys(fixture).at(-1)).toBe('16');
    expect(radiusKeys(fixture)).toEqual(
      expect.arrayContaining(['1', 'full', 'surface', 'control']),
    );
    expect(typeScaleKeys(fixture)).toEqual([
      'display',
      'title',
      'heading',
      'subheading',
      'body',
      'label',
      'caption',
      'micro',
    ]);
  });

  it('records the per-project settings', () => {
    const { project } = fixture;
    expect(Object.keys(project.colors.theme.light)).toHaveLength(12);
    expect(project.focusRing.options).toEqual(['halo', 'offset', 'glow']);
    expect(project.fonts.ui).toBe('Inter');
  });
});

describe('inventory()', () => {
  const cacheDir = mkdtempSync(path.join(tmpdir(), 'weave-inventory-'));
  afterAll(() => rmSync(cacheDir, { recursive: true, force: true }));

  // The real export (with the props and web components the inventory drops) and a real measurement.
  const printFile = (name: string) => ({
    file: 'node',
    args: [
      '-e',
      'process.stdout.write(require("fs").readFileSync(process.argv[1], "utf8"))',
      fileURLToPath(new URL(`./__fixtures__/${name}`, import.meta.url)),
    ],
  });
  const print = printFile('export.json');
  const measure = printFile('boxes.json');
  const fail = { file: 'node', args: ['-e', 'process.exit(1)'] };

  it('builds the inventory from the export and the measurement, then serves the cache without them', async () => {
    const first = await inventory({ templateDir: 'template', cacheDir, exporter: print, measurer: measure });
    expect(first).toEqual(fixture);
    expect(readdirSync(cacheDir)).toEqual([
      expect.stringMatching(/^inventory-[0-9a-f]{64}\.json$/),
    ]);

    const start = performance.now();
    const second = await inventory({ templateDir: 'template', cacheDir, exporter: fail, measurer: fail });
    expect(performance.now() - start).toBeLessThan(200);
    expect(second).toEqual(first);
  });

  it('names the setup step when a tool fails', async () => {
    const empty = path.join(cacheDir, 'empty');
    await expect(
      inventory({ templateDir: 'template', cacheDir: empty, exporter: fail, measurer: measure }),
    ).rejects.toThrow(/mcp:setup/);
    await expect(
      inventory({ templateDir: 'template', cacheDir: empty, exporter: print, measurer: fail }),
    ).rejects.toThrow(/storybook/);
  });

  it('rejects a box for a component the inventory does not have', async () => {
    const odd = { file: 'node', args: ['-e', 'process.stdout.write(JSON.stringify({ "Nope/sm": { height: 1 } }))'] };
    await expect(
      inventory({ templateDir: 'template', cacheDir: path.join(cacheDir, 'odd'), exporter: print, measurer: odd }),
    ).rejects.toThrow(/box Nope\/sm: no such component/);
  });
});
