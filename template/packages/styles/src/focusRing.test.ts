import {
  focusRingClasses,
  focusRings,
  ringBlur,
  ringGap,
  ringGlow,
  ringOpacity,
  ringWidth,
} from './focusRing.css';
import { tokens } from './tokens.css';
import { focusRing } from './utils';

const ringVars = [ringGap, ringWidth, ringBlur, ringGlow, ringOpacity];

describe('focus rings', () => {
  it('every preset sets every ring variable and has a class', () => {
    for (const [name, preset] of Object.entries(focusRings)) {
      expect(Object.keys(preset).sort()).toEqual([...ringVars].sort());
      expect(focusRingClasses[name as keyof typeof focusRings]).toEqual(
        expect.any(String),
      );
    }
  });

  it('defaults to a preset set in tokens.ts', () => {
    expect(Object.keys(focusRings)).toContain(tokens.focusRing);
  });

  it("draws the ring in the control's color, shaped by the preset", () => {
    const ring = focusRing('var(--color)', 'var(--own)');
    expect(ring.boxShadow.startsWith('var(--own), ')).toBe(true);
    expect(ring.outline).toContain(ringWidth);
    expect(ring.outline).toContain('var(--color)');
    expect(ring.outlineOffset).toBe(ringGap);
    for (const ringVar of [ringBlur, ringGlow, ringOpacity])
      expect(ring.boxShadow).toContain(ringVar);
  });
});
