import { globalStyle, style } from '@vanilla-extract/css';

// Room for an email or a name at the body size; every field width is a
// multiple of it, so the fields of one form line up.
export const fieldWidth = '320px';

const widths: Record<string, number> = {
  '0.5x': 0.5,
  '0.75x': 0.75,
  '1x': 1,
  '1.5x': 1.5,
  '2x': 2,
};

/** No wider than its widest field, 2x; `fill` lets it take the whole width. */
export const form = style({
  maxWidth: `calc(${fieldWidth} * 2)`,
  selectors: { '&[data-fill]': { maxWidth: 'none' } },
});

globalStyle(`${form} [data-slot='form-control']`, {
  width: `min(${fieldWidth}, 100%)`,
});
for (const [width, factor] of Object.entries(widths))
  globalStyle(`${form} [data-slot='form-control'][data-width='${width}']`, {
    width: `min(calc(${fieldWidth} * ${factor}), 100%)`,
  });
globalStyle(`${form}[data-fill] [data-slot='form-control']`, {
  width: '100%',
});
