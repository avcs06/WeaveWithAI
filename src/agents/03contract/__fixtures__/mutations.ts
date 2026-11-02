import type { Contract, EntityField, Operation } from '../schema';

/** Each mutation copies the reading-list contract and breaks one rule. */
const edit =
  (change: (copy: Contract) => void) =>
  (value: Contract): Contract => {
    const copy = structuredClone(value);
    change(copy);
    return copy;
  };

const book = (c: Contract) => {
  const found = c.entities.find((e) => e.name === 'Book');
  if (!found) throw new Error('fixture has no Book');
  return found;
};
const field = (c: Contract, name: string): EntityField => {
  const found = book(c).fields.find((f) => f.name === name);
  if (!found) throw new Error(`fixture has no Book.${name}`);
  return found;
};
const op = (c: Contract, id: string): Operation => {
  const found = c.operations.find((o) => o.id === id);
  if (!found) throw new Error(`fixture has no ${id}`);
  return found;
};

export const contractMutations: Record<string, (contract: Contract) => Contract> = {
  'CONTRACT-001': edit((c) => (op(c, 'listBooks').id = 'ListBooks')),
  'CONTRACT-002': edit((c) => (field(c, 'shelf').enum = 'Shelves')),
  'CONTRACT-003': edit((c) => (book(c).noun = 'Novel')),
  'CONTRACT-004': edit((c) =>
    book(c).fields.push({ ...field(c, 'title'), name: 'createdAt', kind: 'datetime' }),
  ),
  'CONTRACT-007': edit((c) => (op(c, 'createBook').inputs[0]!.as = 'isbn')),
  'CONTRACT-010': edit((c) => (op(c, 'createBook').flowSteps = [])),
  'CONTRACT-011': edit((c) => {
    op(c, 'getBook').flowSteps = ['F05.A01'];
    op(c, 'listBooks').flowSteps.push('F05.S01');
  }),
};
