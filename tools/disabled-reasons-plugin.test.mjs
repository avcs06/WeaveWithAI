import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Linter } from 'eslint';
import plugin, {
  createWithReasonOrComment,
} from './eslint/disabled-reasons-plugin.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const appFile = `${root}web/app/events/page.tsx`;
const recipeFile = `${root}packages/ui/src/Tag/Tag.recipe.tsx`;
const componentFile = `${root}packages/ui/src/Tag/Tag.tsx`;

const ruleId = 'disabled-reasons/with-reason-or-comment';
const linter = new Linter();
const reported = (code, { filename = appFile, rules = plugin.rules } = {}) =>
  linter
    .verify(
      code,
      [
        {
          files: ['**/*.tsx'],
          languageOptions: {
            parserOptions: { ecmaFeatures: { jsx: true } },
          },
          plugins: { 'disabled-reasons': { rules } },
          rules: { [ruleId]: 'error' },
        },
      ],
      { filename },
    )
    .filter((message) => message.ruleId === ruleId).length;

const props = {
  Button: ['disabled', 'disabledWithReason', 'loading', 'loadingWithReason'],
  Input: ['readOnly', 'readOnlyWithReason'],
  Table: ['loading'],
};
const stubRules = {
  'with-reason-or-comment': createWithReasonOrComment(
    (name) => props[name] && new Set(props[name]),
  ),
};
const imports = [
  "import { Button } from '@packages/ui/Button';",
  "import { Input } from '@packages/ui/Input';",
  "import { Table } from '@packages/ui/Table';",
].join('\n');
const reportedWithStub = (jsx) =>
  reported(`${imports}\n${jsx}`, { rules: stubRules });

for (const jsx of [
  '<Button disabled />',
  '<Button disabled={!canSubmit} />',
  '<Input readOnly />',
  '<Button loading={saving} />',
  // An empty comment says nothing.
  '<Button\n  //\n  disabled\n/>',
  // A directive for another rule says nothing either.
  '<Button\n  // eslint-disable-next-line no-console\n  disabled\n/>',
]) {
  test(`reports: ${jsx}`, () => {
    assert.equal(reportedWithStub(jsx), 1);
  });
}

for (const jsx of [
  '<Button disabledWithReason="Only admins can edit" />',
  "<Button disabled={saving} disabledWithReason={locked ? 'Locked' : undefined} />",
  '<Button disabled={false} />',
  '<button disabled />',
  // Table can't show a reason for its loading rows.
  '<Table loading />',
  '<Button\n  // Saving takes a moment; a reason would only flash by.\n  loading={saving}\n/>',
  '<Button\n  /* Shown beside the form instead. */\n  disabled={!canSubmit}\n/>',
]) {
  test(`allows: ${jsx}`, () => {
    assert.equal(reportedWithStub(jsx), 0);
  });
}

test('follows a renamed import', () => {
  const code =
    "import { Button as Action } from '@packages/ui/Button';\n<Action disabled />";
  assert.equal(reported(code, { rules: stubRules }), 1);
});

test('skips components from outside the design system', () => {
  const code = "import { Button } from 'some-library';\n<Button disabled />";
  assert.equal(reported(code, { rules: stubRules }), 0);
});

test('reads the real design system: Tag can take a reason, Table cannot', () => {
  const code = [
    "import { Tag } from '@packages/ui/Tag';",
    "import { Table } from '@packages/ui/Table';",
    '<>',
    '  <Tag disabled>Paid</Tag>',
    '  <Table loading />',
    '</>',
  ].join('\n');
  assert.equal(reported(code, { filename: recipeFile }), 1);
});

test("skips components, which forward their caller's state", () => {
  const code = "import { Tag } from '@packages/ui/Tag';\n<Tag disabled />";
  assert.equal(reported(code, { filename: componentFile }), 0);
});
