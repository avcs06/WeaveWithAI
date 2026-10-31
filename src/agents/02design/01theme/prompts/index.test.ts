import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Inventory } from '../../../../ds/inventory';
import { Scope } from '../../../01flows/01scope/schema';
import { Flows } from '../../../01flows/schema';
import { DISPLAY_FONTS, MONO_FONTS, UI_FONTS } from '../fonts';
import { PAGE_ROLES, ROLES } from '../schema';
import { themeSystemPrompt, themeUserMessage } from './index';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;

const scope = Scope.parse(
  read('../../../01flows/__fixtures__/reading-list.scope.json'),
);

const flows = Flows.parse(
  read('../../../01flows/__fixtures__/reading-list.flows.json'),
);

const inventory = read(
  '../../../../ds/__fixtures__/inventory.json',
) as Inventory;

describe('theme prompt', () => {
  const prompt = themeSystemPrompt(inventory);

  it('fills every placeholder, keeps the notes out and carries the design system', () => {
    expect(prompt).not.toContain('{{');
    expect(prompt).not.toContain('<!--');
    expect(prompt).toMatch(/^Button: /m);
  });

  it('lists every ui, display and mono family once, each with its description', () => {
    for (const name of [...UI_FONTS, ...DISPLAY_FONTS, ...MONO_FONTS])
      expect(
        prompt.match(new RegExp(`^- ${name}: \\S`, 'gm')),
        name,
      ).toHaveLength(1);
    expect(prompt).toContain('- JetBrains Mono: ');
    expect(prompt).toContain('Mono fonts:');
  });

  it('names every brief field and says hues are OKLCH degrees', () => {
    for (const field of [
      'audience',
      'personality',
      'voice',
      'density',
      'seedHue',
      'seedChroma',
      'baseHue',
      'baseChroma',
      'statusHues',
      'fonts',
      'radius',
      'focusRing',
      'feel',
      'colorScheme',
      'entities',
      'imagery',
      'references',
    ])
      expect(prompt).toContain(`\`${field}\``);
    expect(prompt).toContain('degrees on the color wheel, 0 to 360');
    // The hue table: OKLCH degrees, not HSL ones (green 142, not 120; blue 266, not 240).
    expect(prompt).toContain('- red: 29\n');
    expect(prompt).toContain('- green: 142\n');
    expect(prompt).toContain('- blue: 266\n');
    expect(prompt.match(/^- [a-z]+: \d+$/gm)).toHaveLength(12);
  });

  it('says how code makes a ramp and which steps read on which, since no ramp exists yet', () => {
    expect(prompt).toContain("Step n of a ramp is the OKLCH color of lightness L(n), chroma C times share(n), and the ramp's hue.");
    expect(prompt).toContain('- C by chroma: neutral 0, muted 0.06, balanced 0.12, vivid 0.17.');
    expect(prompt).toContain('- On step 1: text steps 9 to 12; borders and focus steps 8 to 12.');
    expect(prompt.match(/^- On step \d+: /gm)).toHaveLength(24);
  });

  it('asks for the mood, a background the feel needs, every color role and every layout part', () => {
    expect(prompt).toContain('Choose the colors for the mood the page should put people in when they see it');
    expect(prompt).toContain('It is not limited to one flat color. Choose whatever the feel needs');
    for (const role of [...ROLES, ...PAGE_ROLES])
      expect(prompt).toContain(`\`${role}\``);
    for (const part of [
      'mode',
      'background',
      'logo',
      'status',
      'base',
      'entities',
      'docksFirst',
      'header',
      'sidebar',
      'extraSidebar',
      'footer',
      'main',
      'separation',
      'fullBleed',
    ])
      expect(prompt).toContain(`\`${part}\``);
  });

  it('puts the idea, the scope and the flows in the user message', () => {
    const message = themeUserMessage('<!-- for us only -->A reading list.', scope, flows);
    expect(message).toContain('# Idea\n\nA reading list.');
    expect(message).not.toContain('for us only');
    expect(message).toContain('"name": "Shelf"');
    expect(message).toContain('# Flows (01-flows/04-reconcile.json, what each flow is)');
    expect(message).toContain('"goal": ');
    expect(message).not.toContain('"steps"');
    expect(message).not.toContain('{{');
  });
});
