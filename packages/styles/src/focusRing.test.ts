import {
  focusRingClasses,
  focusRings,
  ringAccentMix,
  ringBlur,
  ringGap,
  ringMix,
  ringWidth,
} from './focusRing.css';
import { tokens } from './tokens.css';

const ringVars = [ringGap, ringWidth, ringBlur, ringMix, ringAccentMix];

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

  it('every color set draws its rings in the shared shape', () => {
    const { controlShadow } = tokens;
    const sets = [
      controlShadow,
      controlShadow.base,
      controlShadow.success,
      controlShadow.warning,
      controlShadow.error,
      controlShadow.info,
    ];
    for (const set of sets)
      for (const ring of [set.focus, set.accentFocus])
        for (const ringVar of [ringGap, ringWidth, ringBlur])
          expect(ring).toContain(ringVar);
  });
});
