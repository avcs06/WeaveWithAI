import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { projectSettings } from './project';

const HEX = /^#[0-9A-F]{6}$/;

describe('projectSettings on the template', () => {
  const settings = projectSettings('template');

  it('reads the theme set and the page colors in both modes', () => {
    const { colors } = settings;
    expect(colors.file).toBe('colors.ts');
    for (const mode of ['light', 'dark'] as const) {
      expect(Object.keys(colors.theme[mode])).toHaveLength(12);
      expect(colors.theme[mode].accentBg).toMatch(HEX);
      expect(Object.keys(colors.page[mode])).toEqual([
        'pageBg',
        'frameBg',
        'pageFg',
        'pageFgMuted',
      ]);
      expect(colors.page[mode].pageBg).toMatch(HEX);
    }
    expect(colors.entity).toEqual([]);
  });

  it('reads the focus ring, the radius presets and the fonts', () => {
    expect(settings.focusRing).toEqual({
      file: 'tokens.ts',
      value: 'halo',
      options: ['halo', 'offset', 'glow'],
    });
    expect(settings.radius).toEqual({
      file: 'tokens.ts',
      surface: '8px',
      control: '6px',
    });
    expect(settings.fonts).toEqual({
      file: 'packages/styles/src/fonts.ts',
      ui: 'Inter',
      display: 'Fraunces',
      mono: 'JetBrains_Mono',
    });
  });
});

describe('projectSettings on a broken template', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'weave-project-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('names the file and the path of a missing value', () => {
    writeFileSync(
      path.join(dir, 'colors.ts'),
      'export const colors = { surface: { light: {}, dark: {} }, entity: { light: {}, dark: {} } };\n',
    );
    expect(() => projectSettings(dir)).toThrow(/colors\.ts colors\.primary/);
  });
});
