import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Scope } from '../../../01flows/01scope/schema';
import { DISPLAY_FONTS, MONO_FONTS, UI_FONTS } from '../fonts';
import { briefSystemPrompt, briefUserMessage } from './index';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;

const scope = Scope.parse(
  read('../../../01flows/__fixtures__/reading-list.scope.json'),
);

describe('brief prompt', () => {
  const prompt = briefSystemPrompt();

  it('fills every placeholder and keeps the notes out', () => {
    expect(prompt).not.toContain('{{');
    expect(prompt).not.toContain('<!--');
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

  it('names every brief field, says hues are degrees, and leaves the design system out', () => {
    for (const field of [
      'audience',
      'personality',
      'voice',
      'density',
      'seedHue',
      'seedChroma',
      'baseHue',
      'baseChroma',
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
    expect(prompt).not.toMatch(/^Button: /m);
  });

  it('puts the idea and the scope in the user message', () => {
    const message = briefUserMessage(
      '<!-- for us only -->A reading list.',
      scope,
    );
    expect(message).toContain('# Idea\n\nA reading list.');
    expect(message).not.toContain('for us only');
    expect(message).toContain('"name": "Shelf"');
    expect(message).not.toContain('{{');
  });
});
