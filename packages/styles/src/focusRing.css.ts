import { createVar, globalStyle, style } from '@vanilla-extract/css';

// eslint-disable-next-line
import { tokens as tokenValues } from '../../../tokens';

/**
 * The focus ring's shape, shared by every control; colors come from the
 * control's color set. The project picks one with `focusRing` in tokens.ts.
 */
export const ringGap = createVar('ringGap');
export const ringWidth = createVar('ringWidth');
export const ringBlur = createVar('ringBlur');
export const ringGlow = createVar('ringGlow');
export const ringOpacity = createVar('ringOpacity');

// Halo and offset draw the ring as an outline; glow blurs a shadow instead.
export const focusRings = {
  halo: {
    [ringGap]: '0px',
    [ringWidth]: '3px',
    [ringBlur]: '0px',
    [ringGlow]: '0px',
    [ringOpacity]: '20%',
  },
  offset: {
    [ringGap]: '2px',
    [ringWidth]: '2px',
    [ringBlur]: '0px',
    [ringGlow]: '0px',
    [ringOpacity]: '100%',
  },
  glow: {
    [ringGap]: '0px',
    [ringWidth]: '0px',
    [ringBlur]: '8px',
    [ringGlow]: '2px',
    [ringOpacity]: '50%',
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
