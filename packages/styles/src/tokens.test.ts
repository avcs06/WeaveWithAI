import { tokens } from './tokens.css';

describe('tokens', () => {
  it('stacks layers so menus open over popovers, and popovers over dialogs', () => {
    const { modal, popover, dropdown, toast, tooltip } = tokens.zIndex;
    expect(modal).toBeLessThan(popover);
    expect(popover).toBeLessThan(dropdown);
    expect(dropdown).toBeLessThan(toast);
    expect(toast).toBeLessThan(tooltip);
  });

  it('keeps every shadow subtle: at most 12% opacity', () => {
    for (const shadow of Object.values(tokens.boxShadow)) {
      const opacity = Number(/ (\d+)%, transparent\)$/.exec(shadow)?.[1]);
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThanOrEqual(12);
    }
  });
});
