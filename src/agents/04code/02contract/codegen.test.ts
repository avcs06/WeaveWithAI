import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Contract } from '../../03contract/schema';
import { entityFiles, signedIn, storagePrefix } from './codegen';
import { renderEntities } from './render';

const contract = JSON.parse(
  readFileSync(new URL('../../03contract/__fixtures__/reading-list.contract.json', import.meta.url), 'utf8'),
) as Contract;

// The browser storage keys carry the run id: two apps on one origin never read each other's records or session.
describe('storage keys', () => {
  const prefix = storagePrefix({ id: '20261102-1425-dashboard-editor' });
  const files = entityFiles(contract, {}, prefix);

  it('prefix every entity store with the run', () => {
    expect(prefix).toBe('weave:20261102-1425-dashboard-editor');
    const stores = [...files].filter(([file]) => file.endsWith('/store.ts')).map(([, text]) => text);
    expect(stores.length).toBeGreaterThan(0);
    for (const text of stores) expect(text).toMatch(/'weave:20261102-1425-dashboard-editor:[a-z]\w*'/);
  });

  it('write the signed-in session under the same auth key', () => {
    expect(Object.keys(signedIn(prefix))).toEqual(['weave:20261102-1425-dashboard-editor:auth']);
  });
});

describe('a get', () => {
  const operations = (c: Contract) =>
    [...entityFiles(c, {}, 'weave:test')].find(([file, text]) => file.includes('/book/') && text.includes('getBook'))?.[1] ?? '';

  it('finds its record by id, or by the one field the user types', () => {
    expect(operations(contract)).toContain('export async function getBook(id: string)');
    const lookup = structuredClone(contract);
    lookup.operations.find((op) => op.id === 'getBook')!.inputs.push({ field: 'FD03', as: 'title' });
    const text = operations(lookup);
    expect(text).toContain("export async function getBook(title: Book['title']): Promise<Book | undefined>");
    expect(text).toContain("export function useGetBook(title: Book['title']): Read<Book | undefined>");
    expect(text).toContain('records.find((record) => record.title === title)');
    expect(renderEntities(lookup)).toContain('`getBook(title)` or `useGetBook(title)`');
    expect(renderEntities(contract)).toContain('`getBook(id)` or `useGetBook(id)`');
  });
});
