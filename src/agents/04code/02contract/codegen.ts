import type { Run } from '../../../core/run';
import type { Contract, Entity, EntityField, Operation } from '../../03contract/schema';
import type { SeedRows } from './schema';

// The contract as the app's entity layer, written by code: one folder per
// entity under web/app/entities/ with its types, seed rows, a persistent store
// and one function per operation. Sign-in (auth) and the mock helpers are the
// template's; the scaffold keys the auth store to the run.

const lower = (name: string) => `${name.charAt(0).toLowerCase()}${name.slice(1)}`;
const upper = (name: string) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
const entityFolder = (entity: string) => `web/app/entities/${lower(entity)}`;
/** A seed row's id, so refs between seed rows can name it before the app runs. */
export const seedId = (entity: string, row: number) => `${lower(entity)}-${row}`;

const SCALAR: Record<EntityField['kind'], string> = {
  string: 'string',
  text: 'string',
  email: 'string',
  url: 'string',
  phone: 'string',
  int: 'number',
  decimal: 'number',
  money: 'number',
  percent: 'number',
  boolean: 'boolean',
  date: 'string',
  time: 'string',
  datetime: 'string',
  enum: 'string',
  ref: 'string',
};

function fieldType(field: EntityField): string {
  const one = field.kind === 'enum' ? field.enum : SCALAR[field.kind];
  return field.list ? `${one}[]` : one;
}

function enumsModule(contract: Contract): string {
  const blocks = contract.enums.map((e) => {
    const options = e.values.map((v) => `  { key: '${v.key}', label: ${JSON.stringify(v.label)} },`).join('\n');
    return `export const ${e.name}Options = [\n${options}\n] as const;\n\nexport type ${e.name} = (typeof ${e.name}Options)[number]['key'];`;
  });
  return `${blocks.join('\n\n')}\n`;
}

function typesModule(entity: Entity, contract: Contract): string {
  const enums = [...new Set(entity.fields.filter((f) => f.kind === 'enum').map((f) => f.enum))];
  const known = new Set(contract.enums.map((e) => e.name));
  const missing = enums.filter((name) => !known.has(name));
  if (missing.length) throw new Error(`${entity.name} uses enums the contract does not define: ${missing.join(', ')}`);
  const imports = enums.length ? `import type { ${enums.sort().join(', ')} } from '../enums';\n\n` : '';
  const fields = entity.fields.map((f) => `  ${f.name}${f.required ? '' : '?'}: ${fieldType(f)};`).join('\n');
  return `${imports}export type ${entity.name} = {
  id: string;
  createdAt: string;
  updatedAt: string;
${fields}
};

/** What a create takes: everything but the fields the store sets. */
export type ${entity.name}Input = Omit<${entity.name}, 'id' | 'createdAt' | 'updatedAt'>;
`;
}

// Rows a couple of days apart over the last weeks, each edited an hour or more after it was made, so a list in order of
// creation or of last edit shows a real order.
const DAY = 86_400_000;
const HOUR = 3_600_000;

function seedModule(entity: Entity, rows: SeedRows[string]): string {
  const now = Date.now();
  const records = rows.map((row, i) => {
    const values = Object.fromEntries(
      entity.fields.flatMap((f) => {
        const value = row[f.name];
        if (value === undefined || value === null || value === '') return [];
        if (f.kind !== 'ref') return [[f.name, value]];
        const toId = (n: unknown) => seedId(f.ref, Number(n));
        return [[f.name, Array.isArray(value) ? value.map(toId) : toId(value)]];
      }),
    );
    const created = now - (rows.length - i) * 2 * DAY;
    return {
      id: seedId(entity.name, i + 1),
      createdAt: new Date(created).toISOString(),
      updatedAt: new Date(created + (i + 1) * HOUR).toISOString(),
      ...values,
    };
  });
  return `import type { ${entity.name} } from './types';

export const ${lower(entity.name)}Seed: ${entity.name}[] = ${JSON.stringify(records, null, 2)};
`;
}

function storeModule(entity: Entity, prefix: string): string {
  const name = entity.name;
  return `import { createPersistentStore } from '@packages/utils/state';

import { ${lower(name)}Seed } from './seed';

import type { ${name} } from './types';

type ${name}State = { records: ${name}[] };

/** Every ${name}, saved in the browser so a reload keeps what the user changed. */
export const use${name}Store = createPersistentStore<${name}State>(
  () => ({ records: ${lower(name)}Seed }),
  '${prefix}:${lower(name)}',
);
`;
}

function operationCode(op: Operation, entity: string): string {
  const store = `use${entity}Store`;
  switch (op.kind) {
    case 'list':
      return `export async function ${op.id}(): Promise<${entity}[]> {
  await mockCall('${op.id}');
  return ${store}.getState().records;
}

export function use${upper(op.id)}(): Read<${entity}[]> {
  return useRead('${op.id}', ${store}('records'));
}`;
    case 'get': {
      // A get finds by id, or by the one field the user types, such as a discount code.
      const by = op.inputs[0]?.as ?? 'id';
      const param = by === 'id' ? 'id: string' : `${by}: ${entity}['${by}']`;
      return `export async function ${op.id}(${param}): Promise<${entity} | undefined> {
  await mockCall('${op.id}');
  return ${store}.getState().records.find((record) => record.${by} === ${by});
}

export function use${upper(op.id)}(${param}): Read<${entity} | undefined> {
  return useRead('${op.id}', ${store}(({ records }) => records.find((record) => record.${by} === ${by})));
}`;
    }
    case 'create':
      return `export async function ${op.id}(input: ${entity}Input): Promise<${entity}> {
  await mockCall('${op.id}');
  const now = new Date().toISOString();
  const record: ${entity} = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  ${store}.setState(({ records }) => ({ records: [...records, record] }));
  return record;
}`;
    case 'update':
      return `export async function ${op.id}(id: string, changes: Partial<${entity}Input>): Promise<${entity}> {
  await mockCall('${op.id}');
  const current = ${store}.getState().records.find((record) => record.id === id);
  if (!current) throw new Error('${entity} not found');
  const record: ${entity} = { ...current, ...changes, updatedAt: new Date().toISOString() };
  ${store}.setState(({ records }) => ({ records: records.map((r) => (r.id === id ? record : r)) }));
  return record;
}`;
    case 'delete':
      return `export async function ${op.id}(id: string): Promise<void> {
  await mockCall('${op.id}');
  ${store}.setState(({ records }) => ({ records: records.filter((record) => record.id !== id) }));
}`;
  }
}

function operationsModule(entity: Entity, operations: Operation[]): string {
  const reads = operations.some((op) => op.kind === 'list' || op.kind === 'get');
  const types = operations.some((op) => op.kind === 'create' || op.kind === 'update')
    ? `${entity.name}, ${entity.name}Input`
    : entity.name;
  return `import { mockCall${reads ? ', type Read, useRead' : ''} } from '../mock';

import { use${entity.name}Store } from './store';

import type { ${types} } from './types';

${operations.map((op) => operationCode(op, entity.name)).join('\n\n')}
`;
}

/** The browser storage keys of one run's app: no two apps on the same origin share records or a session. */
export const storagePrefix = (run: Pick<Run, 'id'>): string => `weave:${run.id}`;

/** Where the auth store keeps the signed-in user in the browser. */
export const authKey = (prefix: string) => `${prefix}:auth`;

/** A signed-in member's browser storage, as the auth store saves it: the checks write it before a signed-in page loads. */
export const signedIn = (prefix: string): Record<string, string> => ({
  [authKey(prefix)]: JSON.stringify({ state: { user: { email: 'member@example.com' } }, version: 0 }),
});

/** The entity's folder exports, named one by one as the template's lint asks. */
function barrel(entity: Entity, operations: Operation[]): string {
  const names = operations.flatMap((op) =>
    op.kind === 'list' || op.kind === 'get' ? [op.id, `use${upper(op.id)}`] : [op.id],
  );
  const types = `export type { ${entity.name}, ${entity.name}Input } from './types';\n`;
  return names.length ? `${types}export { ${names.join(', ')} } from './operations';\n` : types;
}

/** Every file of the entity layer, by path in the app, its stores keyed under `prefix`. Pure. */
export function entityFiles(contract: Contract, seed: SeedRows, prefix: string): Map<string, string> {
  const reserved = contract.entities.filter((e) => ['Auth', 'Mock', 'Enums'].includes(e.name));
  if (reserved.length) throw new Error(`entity names ${reserved.map((e) => e.name).join(', ')} clash with the template's auth and mock folders or the generated enums folder`);
  const files = new Map<string, string>();
  if (contract.enums.length) files.set('web/app/entities/enums/index.ts', enumsModule(contract));
  for (const entity of contract.entities) {
    const folder = entityFolder(entity.name);
    const operations = contract.operations.filter((op) => op.entity === entity.name);
    files.set(`${folder}/types.ts`, typesModule(entity, contract));
    files.set(`${folder}/seed.ts`, seedModule(entity, seed[entity.name] ?? []));
    files.set(`${folder}/store.ts`, storeModule(entity, prefix));
    if (operations.length) files.set(`${folder}/operations.ts`, operationsModule(entity, operations));
    files.set(`${folder}/index.ts`, barrel(entity, operations));
  }
  return files;
}
