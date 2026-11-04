import { describe, expect, it } from 'vitest';
import { readBackground } from './background';

describe('readBackground', () => {
  it('reads every color of a color or a gradient, as hex, in order and once each', () => {
    expect(readBackground('#FBF7F2')).toEqual({ colors: ['#FBF7F2'], problems: [] });
    expect(readBackground('linear-gradient(180deg, #FBF7F2 0%, oklch(0.95 0.02 80) 60%, #FBF7F2 100%)').colors).toHaveLength(2);
    expect(readBackground('radial-gradient(circle at top right, rgba(255, 240, 220, 0.6), transparent 40%), white')).toEqual({
      colors: ['#FFF0DC', '#FFFFFF'],
      problems: [],
    });
  });

  it('names what is neither a color nor a gradient', () => {
    expect(readBackground('url(paper.png), #FFF').problems).toEqual(['it loads an image with url()']);
    expect(readBackground('image-set("a.png" 1x)').problems).toContain('it uses image-set(), which is neither a gradient nor a color');
    expect(readBackground('linear-gradient(to right, transparent, transparent)').problems).toEqual(['it names no color']);
    expect(readBackground('rgb(300 nonsense)').problems).toContain('"rgb(300 nonsense)" is not a valid color');
  });
});
