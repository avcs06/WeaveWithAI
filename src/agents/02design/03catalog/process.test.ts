import { describe, expect, it } from 'vitest';
import { catalog, catalogCall } from '../__fixtures__/chain';
import { minWidth } from './process';

const widget = (id: string) => {
  const found = catalog.widgets.find((w) => w.id === id);
  if (!found) throw new Error(`the catalog has no ${id}`);
  return found;
};

describe('processCatalog', () => {
  it("gives a widget every field of the user steps it serves, its form's included", () => {
    // W07 is the add-book form: F03.S02 saves the book form FM01.
    expect(widget('W07').fields).toEqual(['FD03', 'FD04', 'FD05']);
    expect(widget('W05').fields).toEqual([]);
  });

  it('adds the states its steps require to the ones the catalog gave it', () => {
    // The add-book form needs no state of its own: its result is a toast.
    expect(widget('W07').states).toEqual([]);
    // Listing books and its empty alternative: empty and error.
    expect(widget('W06').states).toEqual(expect.arrayContaining(['empty', 'error']));
  });

  it('adds up the widest row of parts and gaps inside the padding', () => {
    const px = (key: string) => Number(key) * 4;
    const layout = {
      parts: [
        { row: 1, name: 'title', minWidthPx: 160, text: 'ellipsis' as const },
        { row: 2, name: 'field', minWidthPx: 160, text: 'none' as const },
        { row: 2, name: 'button', minWidthPx: 80, text: 'none' as const },
      ],
      gap: '3',
      padding: '4',
    };
    expect(minWidth(layout, px)).toBe(160 + 12 + 80 + 2 * 16);
    expect(minWidth({ ...layout, parts: [] }, px)).toBe(32);
  });
});
