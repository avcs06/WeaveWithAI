import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Inventory } from '../../ds/inventory';
import { skeleton } from './layout';
import { makeScreensSchema, type Screens } from './schema';
import { renderWireframes } from './wireframes';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;
const inventory = read('../../ds/__fixtures__/inventory.json') as Inventory;
const screens = makeScreensSchema(inventory).Screens.parse(
  read('./__fixtures__/reading-list.screens.json'),
) as Screens;
const solved = skeleton(screens, inventory);
const html = renderWireframes(solved, screens, 'reading-list');

describe('renderWireframes', () => {
  it('is one self-contained file: no scripts, no external styles, fonts or images', () => {
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).not.toMatch(/<script|<link|@import|url\(|src=/i);
  });

  it('draws every screen at desktop width, with a hover title per rectangle', () => {
    for (const screen of solved.screens) {
      const start = html.indexOf(`<section class="screen" id="${screen.id}">`);
      const part = html.slice(start, html.indexOf('</section>', start));
      expect(part).toContain(`${screen.id} · ${screen.name}`);
      expect(part.match(/<svg /g)).toHaveLength(1);
      const drawn = screen.rects.filter(
        (rect) => rect.depth > 0 && !rect.id.endsWith('.content'),
      );
      for (const rect of drawn) expect(part).toContain(`<title>${rect.id} · `);
    }
  });

  it('marks new components and lists what the default state hides', () => {
    expect(html).toContain('class="new"');
    expect(html).toContain('TitleCover');
    expect(html).toContain('Not in the default state: S04.n11 (error)');
  });
});
