import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Contract } from '../../03contract/schema';
import { entityFiles, signedIn, storagePrefix } from './codegen';

const contract = JSON.parse(
  readFileSync(new URL('../../03contract/__fixtures__/reading-list.contract.json', import.meta.url), 'utf8'),
) as Contract;

// The browser storage keys carry the run id: two apps on one origin never read each other's records or session.
describe('storage keys', () => {
  const prefix = storagePrefix({ id: '20261102-1425-dashboard-editor' });
  const files = entityFiles(contract, {}, prefix);

  it('prefix every entity store and the auth store with the run', () => {
    expect(prefix).toBe('weave:20261102-1425-dashboard-editor');
    const stores = [...files].filter(([file]) => file.endsWith('/store.ts')).map(([, text]) => text);
    expect(stores.length).toBeGreaterThan(0);
    for (const text of stores) expect(text).toMatch(/'weave:20261102-1425-dashboard-editor:[a-z]\w*'/);
    expect(files.get('web/app/entities/auth/index.ts')).toContain("'weave:20261102-1425-dashboard-editor:auth'");
  });

  it('write the signed-in session under the same auth key', () => {
    expect(Object.keys(signedIn(prefix))).toEqual(['weave:20261102-1425-dashboard-editor:auth']);
  });
});
