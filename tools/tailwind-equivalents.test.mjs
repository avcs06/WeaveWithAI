import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Linter } from 'eslint';
import plugin from './eslint/tailwind-layout-plugin.mjs';
import { loadWorkspaceConfig } from './load-design-system-config.mjs';
import { createDesignSystem } from './weave-design-system-mcp/dist/index.js';

const linter = new Linter();
const system = createDesignSystem(
  await loadWorkspaceConfig(fileURLToPath(new URL('../', import.meta.url))),
);
const cases = [
  ["padding: '16px !important'", false],
  ["width: '100%'", true],
  ["width: '100% !important'", false],
  ["width: '99%'", false],
  ["display: 'flex'", true],
  ["display: 'inline'", false],
  ['minWidth: 0', true],
  ["padding: '16px'", true],
  ['padding: 16', true],
  ["width: '16px'", false],
  ["width: '16px', height: '16px'", true],
  ["paddingLeft: '16px'", false],
  ["paddingLeft: '16px', paddingRight: '16px'", true],
  ['zIndex: 40', true],
  ['zIndex: 41', false],
  ["selectors: { '&:hover': { width: '100%' } }", false],
  ["'@media': { '(min-width: 800px)': { width: '100%' } }", false],
  ['width: `100%`', true],
  ['width: dynamicWidth', false],
];

for (const [declarations, invalid] of cases) {
  test(`exact Tailwind equivalent: ${declarations}`, () => {
    const code = `import { style as css } from '@vanilla-extract/css'; const example = css({ ${declarations} });`;
    const messages = linter.verify(code, [
      {
        plugins: { layout: plugin },
        rules: { 'layout/prefer-tailwind': 'error' },
      },
    ]);
    assert.equal(
      messages.some((message) => message.ruleId === 'layout/prefer-tailwind'),
      invalid,
    );
    const result = system.validate(code);
    assert.equal(
      result.findings.some((finding) => finding.rule === 'prefer-tailwind'),
      invalid,
    );
  });
}

test('unrelated style functions and global styles are not replacements', () => {
  for (const code of [
    "function style(x) { return x; } style({ width: '100%' });",
    "import { globalStyle } from '@vanilla-extract/css'; globalStyle('html', { width: '100%' });",
  ]) {
    assert.equal(
      linter.verify(code, [
        {
          plugins: { layout: plugin },
          rules: { 'layout/prefer-tailwind': 'error' },
        },
      ]).length,
      0,
    );
    assert.ok(
      !system
        .validate(code)
        .findings.some((finding) => finding.rule === 'prefer-tailwind'),
    );
  }
});
