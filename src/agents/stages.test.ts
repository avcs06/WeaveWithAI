import { describe, expect, it } from 'vitest';
import { PIPELINE, stageBatches } from './stages';

describe('stageBatches', () => {
  it('starts screen, invent, draw and frame together after the catalog, and every other stage alone', () => {
    const batches = stageBatches(PIPELINE);
    expect(batches).toContainEqual(['design-screen', 'design-invent', 'design-draw', 'design-frame']);
    const at = batches.findIndex((b) => b.includes('design-screen'));
    expect(batches[at - 1]).toEqual(['design-catalog']);
    expect(batches[at + 1]).toEqual(['design-assemble']);
    expect(batches.filter((b) => b.length > 1)).toHaveLength(1);
    expect(batches.flat()).toEqual(PIPELINE);
  });

  it("cuts a group where the order ends, as --to does", () => {
    const order = PIPELINE.slice(0, PIPELINE.indexOf('design-invent') + 1);
    expect(stageBatches(order).at(-1)).toEqual(['design-screen', 'design-invent']);
  });
});
