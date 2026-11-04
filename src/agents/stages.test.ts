import { describe, expect, it } from 'vitest';
import { PIPELINE, stages } from './stages';

describe('stages', () => {
  it('are registered in pipeline order, so a run without --to goes to the last one', () => {
    const names = stages.map((stage) => stage.name);
    expect(names).toEqual(PIPELINE.filter((name) => names.includes(name)));
    expect(names.at(-1)).toBe('bench');
  });
});
