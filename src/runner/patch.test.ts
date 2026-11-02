import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { assertWithinLimits, toJsonSchema } from '../core/schema';
import { CONTRACT_KEYS, Contract } from '../agents/03contract/schema';
import { applyPatch, patchSchema } from './patch';

const Doc = z.object({
  title: z.string(),
  items: z.array(z.object({ id: z.string(), text: z.string() })),
  parts: z.array(z.object({ name: z.string() })),
});
const keys = { items: 'id', parts: 'name' };

const doc: z.infer<typeof Doc> = {
  title: 'Shelf',
  items: [
    { id: 'I1', text: 'one' },
    { id: 'I2', text: 'two' },
    { id: 'I3', text: 'three' },
  ],
  parts: [{ name: 'head' }],
};

describe('patchSchema', () => {
  it('turns each keyed list into upsert and remove, and every other field into a nullable one', () => {
    const Patch = patchSchema(Doc, keys);
    const patch = {
      title: null,
      items: { upsert: [{ id: 'I2', text: 'TWO' }], remove: ['I3'] },
      parts: { upsert: [], remove: [] },
    };
    expect(Patch.parse(patch)).toEqual(patch);
    expect(() => Patch.parse({ ...patch, items: [] })).toThrow();
  });

  it('refuses a key for a field that is missing or not a list', () => {
    expect(() => patchSchema(Doc, { missing: 'id' })).toThrow(/no list missing/);
    expect(() => patchSchema(Doc, { title: 'id' })).toThrow(/not a list/);
  });

  it('keeps the contract patch within the API limits', () => {
    const ContractPatch = patchSchema(Contract, CONTRACT_KEYS);
    expect(() =>
      assertWithinLimits(toJsonSchema(ContractPatch, 'ContractPatch')),
    ).not.toThrow();
  });
});

describe('applyPatch', () => {
  it('replaces an item in place, adds a new one at the end and removes a listed one', () => {
    const merged = applyPatch(
      doc,
      {
        title: null,
        items: {
          upsert: [
            { id: 'I4', text: 'four' },
            { id: 'I1', text: 'ONE' },
          ],
          remove: ['I2'],
        },
        parts: { upsert: [], remove: [] },
      },
      keys,
    );
    expect(merged.items).toEqual([
      { id: 'I1', text: 'ONE' },
      { id: 'I3', text: 'three' },
      { id: 'I4', text: 'four' },
    ]);
    expect(merged.title).toBe('Shelf');
    expect(merged.parts).toEqual(doc.parts);
  });

  it('replaces a field that is not null and keys a list by any property', () => {
    const merged = applyPatch(
      doc,
      {
        title: 'Reading list',
        items: { upsert: [], remove: [] },
        parts: { upsert: [{ name: 'foot' }], remove: ['head'] },
      },
      keys,
    );
    expect(merged.title).toBe('Reading list');
    expect(merged.parts).toEqual([{ name: 'foot' }]);
    expect(merged.items).toEqual(doc.items);
  });

  it("keeps a list inside an item that an update sends empty, as a model means it unchanged, and takes one it fills", () => {
    const screens = { screens: [{ id: 'S03', title: 'Shelf', steps: ['Sees every book on the shelf.'] }] };
    const patch = (steps: string[]) => ({ screens: { upsert: [{ id: 'S03', title: 'My shelf', steps }], remove: [] } });
    // A fix of the title alone that sends S03 with no steps.
    expect(applyPatch(screens, patch([]), { screens: 'id' }).screens).toEqual([
      { id: 'S03', title: 'My shelf', steps: ['Sees every book on the shelf.'] },
    ]);
    expect(applyPatch(screens, patch(['Sees the books by title.']), { screens: 'id' }).screens[0]?.steps).toEqual(['Sees the books by title.']);
  });
});
