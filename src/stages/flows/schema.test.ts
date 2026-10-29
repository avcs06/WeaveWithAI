import { describe, expect, it } from 'vitest';
import { toJsonSchema } from '../../core/schema';
import { keysOf } from '../../core/utils';
import { Flows, Scope } from './schema';

/** Every key at every level, so a test can prove a key is absent. */
describe('flows stage schemas', () => {
  it.each([
    ['Scope', Scope],
    ['Flows', Flows],
  ])('%s converts within the API limits', (name, schema) => {
    const bridged = toJsonSchema(schema, name);
    console.log(`${name} schema stats:`, bridged.stats);
    expect(bridged.stats.depth).toBeLessThanOrEqual(8);
    expect(keysOf(bridged.schema)).not.toContain('oneOf');
    expect(bridged.schema).not.toHaveProperty('$schema');
  });

  it('Flows carries flows, assumptions and questions', () => {
    const { schema } = toJsonSchema(Flows, 'Flows');
    expect(Object.keys(schema.properties as object)).toEqual(
      expect.arrayContaining(['flows', 'assumptions', 'questions']),
    );
  });
});
