require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
  },
});

const { tokens } = require('./tokens.ts');
const { bgVars, textVars, borderVars } = require('./colors.ts');
const plugin = require('tailwindcss/plugin');
const {
  maxBounds,
  minBounds,
} = require('./tools/tailwind-policy.cjs');

const spacingScale = tokens.spacing;
const colorKeywords = {
  inherit: 'inherit',
  current: 'currentColor',
  transparent: 'transparent',
};

const pairValues = Object.fromEntries(
  Object.entries(spacingScale).flatMap(([firstKey, firstValue]) =>
    Object.entries(spacingScale).map(([secondKey, secondValue]) => [
      `${firstKey}-${secondKey}`,
      [firstValue, secondValue],
    ]),
  ),
);

const minmaxValues = Object.fromEntries(
  minBounds.flatMap((minimum) =>
    maxBounds.map((maximum) => [`${minimum}-${maximum}`, [minimum, maximum]]),
  ),
);

const dimensionValue = (axis, value) => {
  if (value === '0') return '0px';
  if (value === 'full') return '100%';
  if (value === 'screen') return axis === 'w' ? '100vw' : '100vh';
  return value;
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    spacing: spacingScale,
    colors: colorKeywords,
    backgroundColor: { ...colorKeywords, ...bgVars },
    textColor: { ...colorKeywords, ...textVars },
    borderColor: { ...colorKeywords, ...borderVars },
    outlineColor: { ...colorKeywords, ...borderVars },
    fontFamily: tokens.fontFamily,
    fontSize: tokens.fontSize,
    fontWeight: tokens.fontWeight,
    lineHeight: tokens.lineHeight,
    borderRadius: tokens.radius,
    inset: spacingScale,
    zIndex: tokens.zIndex,
  },
  plugins: [
    plugin(({ matchUtilities, addUtilities }) => {
      matchUtilities(
        {
          'flex-row-gap': (gap) => ({
            display: 'flex',
            flexDirection: 'row',
            gap,
          }),
          'flex-col-gap': (gap) => ({
            display: 'flex',
            flexDirection: 'column',
            gap,
          }),
          'inline-flex-row-gap': (gap) => ({
            display: 'inline-flex',
            flexDirection: 'row',
            gap,
          }),
          'inline-flex-col-gap': (gap) => ({
            display: 'inline-flex',
            flexDirection: 'column',
            gap,
          }),
        },
        { values: spacingScale },
      );

      matchUtilities(
        {
          p: ([vertical, horizontal]) => ({
            paddingBlock: vertical,
            paddingInline: horizontal,
          }),
          px: ([left, right]) => ({ paddingLeft: left, paddingRight: right }),
          py: ([top, bottom]) => ({ paddingTop: top, paddingBottom: bottom }),
          m: ([vertical, horizontal]) => ({
            marginBlock: vertical,
            marginInline: horizontal,
          }),
          mx: ([left, right]) => ({ marginLeft: left, marginRight: right }),
          my: ([top, bottom]) => ({ marginTop: top, marginBottom: bottom }),
        },
        { values: pairValues },
      );

      matchUtilities(
        {
          'w-minmax': ([minimum, maximum]) => ({
            minWidth: dimensionValue('w', minimum),
            maxWidth: dimensionValue('w', maximum),
          }),
          'h-minmax': ([minimum, maximum]) => ({
            minHeight: dimensionValue('h', minimum),
            maxHeight: dimensionValue('h', maximum),
          }),
        },
        { values: minmaxValues },
      );

      addUtilities({
        '.flex-fill-x': { flex: '1 1 0%', minWidth: '0px' },
        '.flex-fill-y': { flex: '1 1 0%', minHeight: '0px' },
        ...Object.fromEntries(
          Object.entries(tokens.iconSize).map(([key, value]) => [
            `.icon-size-${key}`,
            { width: value, height: value },
          ]),
        ),
      });
    }),
  ],
};
