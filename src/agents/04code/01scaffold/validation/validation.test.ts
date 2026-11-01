import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildTheme, type Theme } from '../../../02design/01theme/build';
import type { ThemeCall } from '../../../02design/01theme/schema';
import { applyColors } from '../apply';
import { validateApplied } from './validation';

const theme: Theme = buildTheme(
  JSON.parse(readFileSync('src/agents/02design/__fixtures__/reading-list.theme.json', 'utf8')) as ThemeCall,
);
const applied = applyColors(readFileSync('template/colors.ts', 'utf8'), theme);

describe('THEME-003', () => {
  it('passes colors.ts as the theme was applied', () => {
    expect(validateApplied({ colorsTs: applied, theme })).toEqual([]);
  });

  it('fails a shade changed after', () => {
    const shade = theme.colors.light!.theme.accentBg;
    const changed = applied.replace(`accentBg: '${shade}'`, "accentBg: '#000000'");
    expect(changed).not.toBe(applied);
    const issues = validateApplied({ colorsTs: changed, theme });
    expect(issues.map((i) => i.rule)).toEqual(['THEME-003']);
    expect(issues[0]?.message).toContain(shade);
  });
});
