import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkScreen, screenExpect } from './conformance';

const read = (file: string) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8')).data;
const design = read('../../fixtures/golden/dashboard-editor/02-design/08-assemble.json');
const contract = read('../../fixtures/golden/dashboard-editor/03-contract.json');
const root = mkdtempSync(path.join(tmpdir(), 'weave-conformance-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('the design check after a coding session', () => {
  const s04 = screenExpect(design, contract, 'S04');

  it('asks the dashboards page for the nodes of the page and its dialog, and the operation that loads its widgets', () => {
    expect(s04.folder).toBe('web/app/(routes)/dashboards');
    expect(s04.testIds).toHaveLength(30);
    expect(s04.testIds).toEqual(expect.arrayContaining(['S04.n01', 'S08.n01']));
    expect(s04.operations).toEqual(['listDashboards']);
  });

  it('passes a folder that names every node and the operation, and lists what another misses', () => {
    const page = (dir: string, text: string) => {
      mkdirSync(path.join(root, dir, s04.folder), { recursive: true });
      writeFileSync(path.join(root, dir, s04.folder, 'page.tsx'), text);
    };
    page('good', `${s04.testIds.map((id) => `<div data-testid="${id}" />`).join('\n')}\nlistDashboards();\n`);
    expect(checkScreen(path.join(root, 'good'), s04)).toEqual({ name: 'design', ok: true, output: '' });
    page('bad', s04.testIds.slice(1).map((id) => `<div data-testid="${id}" />`).join('\n'));
    const bad = checkScreen(path.join(root, 'bad'), s04);
    expect(bad.ok).toBe(false);
    expect(bad.output.split('\n')).toEqual([
      `No element has data-testid "${s04.testIds[0]}".`,
      'Nothing in web/app/(routes)/dashboards calls listDashboards; load the widget\'s data through it.',
    ]);
    expect(checkScreen(path.join(root, 'none'), s04).output).toContain('has no code');
  });
});
