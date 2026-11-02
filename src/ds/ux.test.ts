import { describe, expect, it } from 'vitest';
import { uxPractices } from './ux';

describe('the UX practices', () => {
  it('come from the template, one rule a line, with no title and no placeholders', () => {
    const text = uxPractices();
    expect(text.startsWith('Rules every screen follows')).toBe(true);
    expect(text).not.toContain('{{');
    for (const section of ['## Lists and records', '## Actions', '## Editing', '## Forms', '## Frames', '## Spacing'])
      expect(text).toContain(section);
    expect(text.split('\n').filter((line) => line.startsWith('- ')).length).toBeGreaterThan(15);
  });
});
