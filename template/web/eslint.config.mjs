import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import baseConfig from '../eslint.config.mjs';

export default [
  { plugins: { '@next/next': nextEslintPluginNext } },
  ...nx.configs['flat/react-typescript'],
  ...baseConfig,
  {
    ignores: ['.next/**/*'],
  },
  // App code follows the design-system MCP's styling
  // rules, which the coding agent runs on every file it writes; these three are
  // for the design system's own code.
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'tailwind-layout/no-vanilla-layout': 'off',
      'tailwind-layout/restricted-classes': 'off',
      'tailwind-layout/prefer-tailwind': 'off',
    },
  },
];
