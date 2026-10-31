import { describe, expect, it } from 'vitest';
import { toJsonSchema } from '../../core/schema';
import { Contract } from './schema';

describe('contract schema', () => {
  it('converts within the API limits, and stays the shortest call', () => {
    const bridged = toJsonSchema(Contract, 'Contract');
    expect(bridged.stats.depth).toBeLessThanOrEqual(8);
    expect(bridged.stats.properties).toBeLessThanOrEqual(30);
  });
});
