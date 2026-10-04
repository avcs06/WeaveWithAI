const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../tailwind.preset.cjs')],
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/!(*.stories|*.spec).{ts,tsx,html}',
    ),
    join(
      __dirname,
      '../packages/ui/src/**/!(*.stories|*.spec).{ts,tsx,html}',
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
