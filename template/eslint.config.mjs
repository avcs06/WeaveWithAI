import nx from '@nx/eslint-plugin';
import tailwindLayoutPlugin from './tools/eslint/tailwind-layout-plugin.mjs';
import importPlugin from 'eslint-plugin-import';
import importRulesPlugin from './tools/eslint/import-rules-plugin.mjs';
import disabledReasonsPlugin from './tools/eslint/disabled-reasons-plugin.mjs';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],

  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  {
    ignores: [
      '**/*',
      '!**/app',
      '!**/app/**/*',
      '!**/src',
      '!**/src/**/*',
      '**/*.stories.ts',
      '**/*.stories.tsx',
      '**/*.stories.js',
      '**/*.stories.jsx',
    ],
  },

  // Enforce one-way dependency flow across Nx project layers (assets → styles → utils → ui → web)
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$', '^@app/.*'],
          depConstraints: [
            { sourceTag: 'layer:1-assets', onlyDependOnLibsWithTags: [] },
            {
              sourceTag: 'layer:2-styles',
              onlyDependOnLibsWithTags: ['layer:1-assets'],
            },
            {
              sourceTag: 'layer:3-utils',
              onlyDependOnLibsWithTags: ['layer:1-assets', 'layer:2-styles'],
            },
            {
              sourceTag: 'layer:4-ui',
              onlyDependOnLibsWithTags: [
                'layer:1-assets',
                'layer:2-styles',
                'layer:3-utils',
              ],
            },
            {
              sourceTag: 'layer:5-web',
              onlyDependOnLibsWithTags: [
                'layer:1-assets',
                'layer:2-styles',
                'layer:3-utils',
                'layer:4-ui',
              ],
            },
            {
              sourceTag: 'layer:5-recipes',
              onlyDependOnLibsWithTags: [
                'layer:1-assets',
                'layer:2-styles',
                'layer:3-utils',
                'layer:4-ui',
              ],
            },
            { sourceTag: '*', onlyDependOnLibsWithTags: ['*'] },
          ],
        },
      ],
    },
  },

  // Recipes are app code kept beside their component: they import the package
  // the way an app does, which the same-project check above would reject.
  {
    files: ['**/*.recipe.tsx'],
    rules: { '@nx/enforce-module-boundaries': 'off' },
  },

  // Enforce the Tailwind/Vanilla Extract styling boundary.
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    plugins: {
      'tailwind-layout': tailwindLayoutPlugin,
    },
    rules: {
      'tailwind-layout/no-vanilla-layout': 'error',
      'tailwind-layout/restricted-classes': 'error',
      'tailwind-layout/prefer-tailwind': 'error',
    },
  },

  // A control that blocks the user says why, or a comment says why it can't.
  {
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: { 'disabled-reasons': disabledReasonsPlugin },
    rules: { 'disabled-reasons/with-reason-or-comment': 'error' },
  },

  // Sort imports into groups (builtin → external → @packages/* in layer order → relative) with blank lines between
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: { import: importPlugin },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@packages/assets/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@packages/styles/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@packages/utils/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@packages/ui/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin', 'external'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // Enforce one-way import flow within web/app folders (shared → entities → components → blocks → routes)
  {
    files: [
      'web/app/**/*.ts',
      'web/app/**/*.tsx',
      'web/app/**/*.js',
      'web/app/**/*.jsx',
    ],
    plugins: { import: importPlugin },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './web/app/shared',
              from: [
                './web/app/entities',
                './web/app/components',
                './web/app/blocks',
                './web/app/(routes)',
              ],
              message:
                'shared cannot import from entities, components, blocks, or routes.',
            },
            {
              target: './web/app/entities',
              from: [
                './web/app/components',
                './web/app/blocks',
                './web/app/(routes)',
              ],
              message:
                'entities cannot import from components, blocks, or routes.',
            },
            {
              target: './web/app/components',
              from: ['./web/app/blocks', './web/app/(routes)'],
              message: 'components cannot import from blocks or routes.',
            },
            {
              target: './web/app/blocks',
              from: ['./web/app/(routes)'],
              message: 'blocks cannot import from routes.',
            },
          ],
        },
      ],
    },
  },

  // Block sibling route imports and require barrel-only access to sibling folders
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: { 'import-rules': importRulesPlugin },
    rules: {
      'import-rules/no-routes-sibling-imports': 'error',
      'import-rules/barrel-only-sibling-imports': 'error',
    },
  },

  // Allow only module-level barrel imports from @packages/* — no deep internal paths
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@packages/ui/*/*'],
              message:
                'Import from @packages/ui/ModuleName only. Deep imports into package internals are not allowed.',
            },
            {
              group: ['@packages/styles/*/*'],
              message:
                'Import from @packages/styles/ModuleName only. Deep imports into package internals are not allowed.',
            },
            {
              group: ['@packages/utils/*/*'],
              message:
                'Import from @packages/utils/ModuleName only. Deep imports into package internals are not allowed.',
            },
          ],
        },
      ],
    },
  },

  // Require explicit named exports in barrels — no re-exporting everything blindly
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message:
            'Replace "export * from" with explicit named exports. Barrel files must only export what is used outside.',
        },
      ],
    },
  },
];
