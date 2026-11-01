import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkScreen, nodeWords } from './conformance';

const root = mkdtempSync(path.join(tmpdir(), 'weave-conformance-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('the design check after a coding session', () => {
  it("leaves out the text of a node that shows data, a sample of its value, and keeps its label", () => {
    const nodes = [
      { id: 'SH1.n03', text: 'Q3 launch board', label: '', data: ['Dashboard.name'] },
      { id: 'SH1.S05.n01', text: 'Q3 launch board', label: 'Dashboard name', data: ['Dashboard.name'] },
      { id: 'SH1.n04', text: 'Create', label: '', data: [] },
    ];
    expect(nodeWords(nodes)).toEqual([
      { id: 'SH1.S05.n01', text: 'Dashboard name' },
      { id: 'SH1.n04', text: 'Create' },
    ]);
  });

  it('passes a folder with nothing to find, empty or not', () => {
    const nothing = { folder: 'web/app/blocks', testIds: [], words: [], operations: [] };
    expect(checkScreen(path.join(root, 'empty'), nothing)).toEqual({ name: 'design', ok: true, output: '' });
  });
});
