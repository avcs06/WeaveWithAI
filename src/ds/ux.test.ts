import { describe, expect, it } from 'vitest';
import { DESIGN_SECTIONS, uxPractices } from './ux';

describe('the UX practices', () => {
  it('come from the template, one rule a line, with no title and no placeholders', () => {
    const text = uxPractices();
    expect(text.startsWith('Rules every screen follows')).toBe(true);
    expect(text).not.toContain('{{');
    for (const section of ['## Lists and records', '## Actions', '## Editing', '## Forms', '## Frames', '## Spacing'])
      expect(text).toContain(section);
    expect(text.split('\n').filter((line) => line.startsWith('- ')).length).toBeGreaterThan(15);
  });

  it('give the design prose only the sections its steps decide, with no component names', () => {
    const text = uxPractices(DESIGN_SECTIONS);
    expect(text.match(/^## /gm)).toHaveLength(DESIGN_SECTIONS.length);
    expect(text).toContain('## Editing');
    expect(text).not.toContain('## Forms');
    expect(text).not.toMatch(/`[A-Z]\w+`/);
    expect(() => uxPractices(['Nope'])).toThrow('no section Nope');
  });
});
