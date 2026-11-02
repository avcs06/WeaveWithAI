import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { flows, scope } from '../../02design/__fixtures__/chain';
import { contractMutations } from '../__fixtures__/mutations';
import { Contract } from '../schema';
import { contractRules, validateContract } from './validation';

const contract = Contract.parse(
  JSON.parse(readFileSync(new URL('../__fixtures__/reading-list.contract.json', import.meta.url), 'utf8')),
);
const ctx = { scope, flows };
const ids = (c: Contract) => validateContract(Contract.parse(c), ctx).map((issue) => issue.rule);
const op = (c: Contract, id: string) => c.operations.find((o) => o.id === id)!;

describe('contract rules on the reading-list contract', () => {
  it('passes every rule', () => {
    expect(validateContract(contract, ctx)).toEqual([]);
  });

  it('pairs each rule with exactly one mutation', () => {
    expect(Object.keys(contractMutations).sort()).toEqual(contractRules.map((rule) => rule.id).sort());
    expect(contractRules).toHaveLength(7);
  });

  it.each(contractRules.map((rule) => rule.id))('%s fires on its mutation and not on the valid contract', (id) => {
    const mutate = contractMutations[id];
    if (!mutate) throw new Error(`no mutation for ${id}`);
    expect(ids(mutate(contract))).toContain(id);
    expect(ids(contract)).not.toContain(id);
  });

  it('CONTRACT-007 lets only a list take q', () => {
    const search = structuredClone(contract);
    op(search, 'listBooks').inputs.push({ field: 'FD03', as: 'q' });
    expect(ids(search)).not.toContain('CONTRACT-007');
    op(search, 'createBook').inputs[0]!.as = 'q';
    expect(ids(search)).toContain('CONTRACT-007');
  });
});
