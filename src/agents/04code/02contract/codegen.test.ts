import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Contract } from '../../03contract/schema';
import { fakeSeed } from './__fixtures__/seed';
import { entityFiles } from './codegen';
import { seedSchema } from './schema';
import { validateSeed } from './validation/validation';

const contract = JSON.parse(readFileSync('fixtures/golden/freelancer-workspace/03-contract.json', 'utf8')).data as Contract;
const seed = fakeSeed(contract);

describe('the entity layer', () => {
  it('writes the golden freelancer contract as it was checked in an app', () => {
    const files = entityFiles(contract, seed);
    expect([...files.keys()]).toContain('web/app/entities/auth/index.ts');
    expect([...files.keys()]).toContain('web/app/entities/session/operations.ts');
    expect(Object.fromEntries(files)).toMatchSnapshot();
  });

  it('turns a seed ref into the id of the row it names', () => {
    const projects = entityFiles(contract, seed).get('web/app/entities/project/seed.ts') ?? '';
    expect(projects).toContain('"client": "client-1"');
  });

  it('refuses names that clash with its own folders, and operations it cannot write', () => {
    const auth = { ...contract, entities: [...contract.entities, { name: 'Auth', noun: 'Auth', fields: [] }] };
    expect(() => entityFiles(auth, seed)).toThrow(/Auth/);
    const action = { ...contract, operations: [{ ...contract.operations[0]!, kind: 'action' as const, id: 'archiveClient' }] };
    expect(() => entityFiles(action, seed)).toThrow(/archiveClient/);
  });
});

describe('the seed', () => {
  it('fits the schema built from the contract', () => {
    expect(seedSchema(contract).safeParse(seed).success).toBe(true);
    const enumField = contract.entities.flatMap((e) => e.fields.map((f) => ({ e, f }))).find(({ f }) => f.kind === 'enum')!;
    const wrong = { ...seed, [enumField.e.name]: [{ ...seed[enumField.e.name]![0], [enumField.f.name]: 'no_such_key' }] };
    expect(seedSchema(contract).safeParse(wrong).success).toBe(false);
  });

  it('passes every seed rule with four full rows per entity', () => {
    expect(validateSeed({ seed, contract })).toEqual([]);
  });

  it('SEED-002 fails an entity with three rows', () => {
    const [entity] = contract.entities;
    const short = { ...seed, [entity!.name]: seed[entity!.name]!.slice(0, 3) };
    expect(validateSeed({ seed: short, contract }).map((i) => [i.rule, i.at])).toEqual([['SEED-002', entity!.name]]);
  });

  it('SEED-003 fails a required field left empty', () => {
    const { e, f } = contract.entities.flatMap((e) => e.fields.map((f) => ({ e, f }))).find(({ f }) => f.required && f.kind === 'string' && !f.list)!;
    const empty = { ...seed, [e.name]: [{ ...seed[e.name]![0], [f.name]: '' }, ...seed[e.name]!.slice(1)] };
    expect(validateSeed({ seed: empty, contract }).map((i) => i.rule)).toEqual(['SEED-003']);
  });

  it('SEED-004 fails a date that is not ISO 8601', () => {
    const { e, f } = contract.entities.flatMap((e) => e.fields.map((f) => ({ e, f }))).find(({ f }) => f.kind === 'date' && !f.list)!;
    const loose = { ...seed, [e.name]: [{ ...seed[e.name]![0], [f.name]: 'March 14' }, ...seed[e.name]!.slice(1)] };
    expect(validateSeed({ seed: loose, contract }).map((i) => i.rule)).toEqual(['SEED-004']);
  });

  it('SEED-001 passes refs to rows that exist and fails one past the list', () => {
    expect(validateSeed({ seed, contract })).toEqual([]);
    const ref = contract.entities.flatMap((e) => e.fields.map((f) => ({ e, f }))).find(({ f }) => f.kind === 'ref' && !f.list)!;
    const past = { ...seed, [ref.e.name]: [{ ...seed[ref.e.name]![0], [ref.f.name]: 5 }, ...seed[ref.e.name]!.slice(1)] };
    expect(validateSeed({ seed: past, contract }).map((i) => i.rule)).toEqual(['SEED-001']);
  });
});
