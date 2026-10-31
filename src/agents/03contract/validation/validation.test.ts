import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { catalog, flows, scope } from '../../02design/__fixtures__/chain';
import { contractMutations } from '../__fixtures__/mutations';
import { Contract } from '../schema';
import { contractRules, validateContract } from './validation';

const contract = Contract.parse(
  JSON.parse(readFileSync(new URL('../__fixtures__/reading-list.contract.json', import.meta.url), 'utf8')),
);
const ctx = { scope, flows, widgets: catalog.widgets };
const ids = (c: Contract) => validateContract(Contract.parse(c), ctx).map((issue) => issue.rule);
const op = (c: Contract, id: string) => c.operations.find((o) => o.id === id)!;

describe('contract rules on the reading-list contract and catalog', () => {
  it('passes every rule', () => {
    expect(validateContract(contract, ctx)).toEqual([]);
  });

  it('pairs each rule with exactly one mutation', () => {
    expect(Object.keys(contractMutations).sort()).toEqual(contractRules.map((rule) => rule.id).sort());
    expect(contractRules).toHaveLength(9);
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

  it('CONTRACT-012 takes a field in any operation of its flow, never of another', () => {
    const later = structuredClone(contract);
    op(later, 'createBook').flowSteps = ['F03.A01', 'F03.A02'];
    expect(ids(later)).not.toContain('CONTRACT-012');
    const elsewhere = structuredClone(contract);
    op(elsewhere, 'createBook').inputs.shift();
    op(elsewhere, 'listBooks').inputs.push({ field: 'FD03', as: 'q' });
    expect(ids(elsewhere)).toContain('CONTRACT-012');
  });

  it('CONTRACT-020 wants every shown value a field, and a list for a widget that repeats', () => {
    const missing = structuredClone(contract);
    missing.entities[0]!.fields = missing.entities[0]!.fields.filter((f) => f.name !== 'author');
    op(missing, 'createBook').inputs = op(missing, 'createBook').inputs.filter((i) => i.as !== 'author');
    expect(validateContract(missing, ctx).filter((i) => i.rule === 'CONTRACT-020').map((i) => i.at)).toEqual([
      'W06',
      'W08',
      'W09',
    ]);
    const single = structuredClone(contract);
    single.widgets[0]!.reads = ['getBook'];
    expect(ids(single)).toContain('CONTRACT-020');
    const wrong = structuredClone(contract);
    wrong.widgets[1]!.reads = ['createBook'];
    expect(ids(wrong)).toContain('CONTRACT-020');
  });

  it('CONTRACT-020 lets an add form show the record its flow creates without a read, but not an edit form', () => {
    const form = { ...catalog.widgets.find((w) => w.id === 'W07')!, data: ['Book.title', 'Book.author'] };
    const widgets = catalog.widgets.map((w) => (w.id === 'W07' ? form : w));
    const at = (c: Contract) =>
      validateContract(c, { ...ctx, widgets })
        .filter((issue) => issue.rule === 'CONTRACT-020')
        .map((issue) => issue.at);
    expect(at(contract)).toEqual([]);
    const edit = structuredClone(contract);
    op(edit, 'createBook').kind = 'update';
    expect(at(edit)).toEqual(['W07']);
  });
});
