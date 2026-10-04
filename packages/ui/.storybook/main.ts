import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import babel from '@rolldown/plugin-babel';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { mergeConfig } from 'vite';

import type { StorybookConfig } from '@storybook/react-vite';

const require = createRequire(import.meta.url);
const fromHere = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  framework: '@storybook/react-vite',
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      plugins: [
        vanillaExtractPlugin(),
        // Same React Compiler (babel-plugin-react-compiler) as the Next app.
        react(),
        babel({ presets: [reactCompilerPreset()] }),
      ],
      resolve: {
        // Same aliases as tsconfig.base.json paths.
        alias: {
          '@packages/ui': fromHere('../src'),
          '@packages/styles': fromHere('../../styles/src'),
          '@packages/utils': fromHere('../../utils/src'),
        },
      },
      css: {
        postcss: {
          plugins: [
            require('tailwindcss')({
              presets: [require('../../../tailwind.preset.cjs')],
              content: [fromHere('../src/**/*.{ts,tsx}')],
            }),
            require('autoprefixer'),
          ],
        },
      },
    }),
};

export default config;
