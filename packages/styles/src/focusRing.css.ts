import { createVar, globalStyle, style } from '@vanilla-extract/css';

// eslint-disable-next-line
import { tokens as tokenValues } from '../../../tokens';

/**
 * The focus ring's shape, shared by every control. Colors still come from the
 * control's color set; these only shape the ring. The project picks one with
 * `focusRing` in tokens.ts.
 */
export const ringGap = createVar('ringGap');
export const ringWidth = createVar('ringWidth');
export const ringBlur = createVar('ringBlur');
// How much accent the ring takes: over transparent on regular controls, over
// the hover background on filled accent controls.
export const ringMix = createVar('ringMix');
export const ringAccentMix = createVar('ringAccentMix');

export const focusRings = {
  halo: {
    [ringGap]: '0px',
    [ringWidth]: '3px',
    [ringBlur]: '0px',
    [ringMix]: '20%',
    [ringAccentMix]: '0%',
  },
  offset: {
    [ringGap]: '2px',
    [ringWidth]: '2px',
    [ringBlur]: '0px',
    [ringMix]: '100%',
    [ringAccentMix]: '100%',
  },
  glow: {
    [ringGap]: '0px',
    [ringWidth]: '2px',
    [ringBlur]: '8px',
    [ringMix]: '50%',
    [ringAccentMix]: '50%',
  },
};

export type FocusRing = keyof typeof focusRings;

globalStyle(':root', { vars: focusRings[tokenValues.focusRing] });

// Declared after the :root default, so a class on the root overrides it.
export const focusRingClasses = {
  halo: style({ vars: focusRings.halo }),
  offset: style({ vars: focusRings.offset }),
  glow: style({ vars: focusRings.glow }),
};
