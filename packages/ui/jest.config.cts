module.exports = {
  displayName: 'ui',
  preset: '../../jest.preset.js',
  transform: {
    // vanilla-extract styles build to class names at test time.
    '\\.css\\.ts$': '@vanilla-extract/jest-transform',
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    // With the React Compiler, as the app and Storybook build components.
    '^.+\\.[tj]sx?$': [
      'babel-jest',
      {
        presets: ['@nx/react/babel'],
        plugins: ['babel-plugin-react-compiler'],
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  resolver: '<rootDir>/jest.resolver.cjs',
  // These ship ES modules only; let Babel compile them (pnpm paths too).
  transformIgnorePatterns: [
    '/node_modules/(?!\\.pnpm/(lodash-es|uuid)@|(lodash-es|uuid)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/packages/ui',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.stories.tsx',
    '!src/**/*.css.ts',
    // Types only: no runtime code to cover.
    '!src/**/*.types.ts',
    '!src/**/index.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-setup.ts',
    '!src/test-utils.tsx',
    '!src/StoryLayout.tsx',
  ],
};
