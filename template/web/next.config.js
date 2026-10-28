//@ts-check

const { composePlugins, withNx } = require('@nx/next');
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  experimental: { externalDir: true },
  reactCompiler: true,
};

const withVanillaExtract = createVanillaExtractPlugin({
  test: /\.(css|recipes)\.(js|cjs|mjs|jsx|ts|tsx)$/,
  unstable_turbopack: {
    mode: 'auto',
    glob: [
      '**/*.css.{js,cjs,mjs,jsx,ts,tsx}',
      '**/*.recipes.{js,cjs,mjs,jsx,ts,tsx}',
    ],
  },
});

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withVanillaExtract,
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
