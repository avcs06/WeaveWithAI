import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadWorkspaceConfig } from './load-design-system-config.mjs';
import { createDesignSystem } from './weave-design-system-mcp/dist/index.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const system = createDesignSystem(await loadWorkspaceConfig(root));
// The entry points designsystem.config.json lists: the ui barrels, the
// hooks barrel, and the web components.
const entryPoint =
  /\/(packages\/ui\/src\/[^/]+\/index\.tsx?|packages\/utils\/src\/hooks\/index\.ts|web\/app\/components\/([^/]+\.tsx|[^/]+\/index\.tsx?))$/;

test('discovery is limited to the configured entry points', () => {
  for (const { name } of system.components()) {
    assert.match(system.component(name).filePath, entryPoint);
  }
  assert.ok(system.component('Button'));
  assert.ok(system.component('Input'));
  assert.ok(!system.component('NativeSelect'));
  assert.ok(!system.component('ToastQueue'));
});
const alternatives = {
  checkbox: 'Checkbox',
  dialog: 'Dialog',
  'dropdown-menu': 'Dropdown',
  popover: 'Popover',
  'radio-group': 'RadioGroup',
  'scroll-area': 'ScrollArea',
  switch: 'Switch',
  tabs: 'Tabs',
  toast: 'toast',
};

for (const [name, owner] of Object.entries(alternatives)) {
  const source = `@radix-ui/react-${name}`;
  test(`${source} directs consumers to ${owner}`, () => {
    assert.ok(
      system
        .component(owner)
        ?.invalidAlternatives.includes(`import('${source}')`),
    );
    for (const specifier of [
      '{ Root }',
      '{ Root as CustomRoot }',
      '* as Primitive',
    ]) {
      const result = system.validate(`import ${specifier} from '${source}';`);
      assert.ok(
        result.findings.some(
          (finding) =>
            finding.rule === 'invalid-alternative' &&
            finding.suggestion === owner,
        ),
      );
    }
    for (const code of [
      `import type { Root } from '${source}';`,
      `import { type Root } from '${source}';`,
      `import { ${owner} } from '@packages/ui/${owner}';`,
    ]) {
      assert.ok(
        !system
          .validate(code)
          .findings.some((finding) => finding.rule === 'invalid-alternative'),
      );
    }
  });
}

test('Slot remains an allowed composition utility', () => {
  assert.ok(system.validate("import { Slot } from '@radix-ui/react-slot';").ok);
});
