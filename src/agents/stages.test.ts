import { describe, expect, it } from 'vitest';
import { PIPELINE, stageBatches, stages } from './stages';

describe('stages', () => {
  it('are registered in pipeline order, so a run without --to goes to the last one', () => {
    const names = stages.map((stage) => stage.name);
    expect(names).toEqual(PIPELINE.filter((name) => names.includes(name)));
    expect(names.at(-1)).toBe('code-pages');
  });
});

describe('stageBatches', () => {
  it('starts the contract, screen, invent, draw and frame together after the catalog, and every other stage alone', () => {
    const batches = stageBatches(PIPELINE);
    expect(batches).toContainEqual(['contract', 'design-screen', 'design-invent', 'design-draw', 'design-frame']);
    const at = batches.findIndex((b) => b.includes('contract'));
    expect(batches[at - 1]).toEqual(['design-catalog']);
    expect(batches[at + 1]).toEqual(['design-assemble']);
    expect(batches.filter((b) => b.length > 1)).toHaveLength(1);
    expect(batches.flat()).toEqual(PIPELINE);
  });

  it("cuts a group where the order ends, as --to does", () => {
    const order = PIPELINE.slice(0, PIPELINE.indexOf('design-invent') + 1);
    expect(stageBatches(order).at(-1)).toEqual(['contract', 'design-screen', 'design-invent']);
  });

  it('runs the contract alone after the catalog with --to contract', () => {
    const order = PIPELINE.slice(0, PIPELINE.indexOf('contract') + 1);
    expect(stageBatches(order).slice(-2)).toEqual([['design-catalog'], ['contract']]);
  });
});
