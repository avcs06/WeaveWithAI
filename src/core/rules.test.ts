import { describe, expect, it } from 'vitest';
import {
  defineRule,
  duplicates,
  isCamel,
  isPascal,
  levenshtein,
  runRules,
} from './rules';

describe('rule helpers', () => {
  it('defineRule stamps the id and severity on every issue and runRules concatenates', () => {
    const even = defineRule<number>('T-001', 'mandatory', (n, fail) =>
      n % 2 ? [fail(`${n} is odd`, 'n')] : [],
    );
    const small = defineRule<number>('T-002', 'warning', (n, fail) =>
      n > 10 ? [fail(`${n} is large`)] : [],
    );
    expect(runRules([even, small], 13)).toEqual([
      { rule: 'T-001', severity: 'mandatory', message: '13 is odd', at: 'n' },
      { rule: 'T-002', severity: 'warning', message: '13 is large' },
    ]);
    expect(runRules([even, small], 4)).toEqual([]);
  });

  it('checks casing and finds duplicates', () => {
    expect(['member', 'shopOwner', 'a1'].every(isCamel)).toBe(true);
    expect(['Member', 'shop_owner', '1a', ''].some(isCamel)).toBe(false);
    expect(['Project', 'TaskItem'].every(isPascal)).toBe(true);
    expect(['project', 'Task Item'].some(isPascal)).toBe(false);
    expect(duplicates(['a', 'b', 'a', 'c', 'b', 'a'], (x) => x)).toEqual([
      'a',
      'b',
    ]);
  });

  it('computes edit distance', () => {
    expect(levenshtein('dueDate', 'dueDate')).toBe(0);
    expect(levenshtein('dueDate', 'duedate')).toBe(1);
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});
