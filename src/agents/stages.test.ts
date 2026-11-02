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
  const groups = [['b', 'c', 'd']];

  it('starts a side-by-side group together, and every other stage alone', () => {
    expect(stageBatches(['a', 'b', 'c', 'd', 'e'], groups)).toEqual([
      ['a'],
      ['b', 'c', 'd'],
      ['e'],
    ]);
  });

  it('cuts a group where the order ends, as --to does', () => {
    expect(stageBatches(['a', 'b', 'c'], groups)).toEqual([['a'], ['b', 'c']]);
  });

  it('runs every pipeline stage alone while no stages share a batch', () => {
    expect(stageBatches(PIPELINE).every((batch) => batch.length === 1)).toBe(
      true,
    );
  });
});
