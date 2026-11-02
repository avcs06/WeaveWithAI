import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { checkScreen } from './conformance';

const root = mkdtempSync(path.join(tmpdir(), 'weave-conformance-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('the screen check after a coding session', () => {
  it('fails a screen with no code in its route folder', () => {
    const expected = { folder: 'web/app/(routes)/books', operations: [] };
    expect(checkScreen(path.join(root, 'empty'), expected)).toEqual({
      name: 'design',
      ok: false,
      output: 'web/app/(routes)/books has no code.',
    });
  });

  it('passes a screen that calls each operation by its function or its hook', () => {
    const folder = path.join(root, 'app', 'web/app/(routes)/books');
    mkdirSync(folder, { recursive: true });
    writeFileSync(path.join(folder, 'page.tsx'), 'useListBooks(); createBook();\n');
    const expected = { folder: 'web/app/(routes)/books', operations: ['listBooks', 'createBook'] };
    expect(checkScreen(path.join(root, 'app'), expected)).toEqual({ name: 'design', ok: true, output: '' });
  });
});
