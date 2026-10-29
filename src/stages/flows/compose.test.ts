import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { GenerateInput, GenerateResult } from '../../core/llm';
import type { Call } from '../../core/runSpecStage';
import {
  applyPatch,
  assemble,
  batchesOf,
  expandCompose,
  reconcileCompose,
} from './compose';
import { Catalog, type Flow, Flows, type FlowsPatch, Scope } from './schema';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), 'utf8'),
  );
const scope = Scope.parse(load('reading-list.scope.json'));
const flows = Flows.parse(load('reading-list.flows.json'));
const catalog = Catalog.parse(load('reading-list.catalog.json'));
const flow = (id: string): Flow => {
  const found = flows.flows.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
};
const emptyPatch: FlowsPatch = {
  upsertFlows: [],
  upsertFields: [],
  upsertForms: [],
  upsertSubflows: [],
  removeFlows: [],
  assumptions: [],
  questions: [],
};

/** A `Call` that answers with scripted data and remembers what it was asked. */
function fakeCall(answers: unknown[]) {
  const inputs: GenerateInput<unknown>[] = [];
  const call: Call = async (input) => {
    inputs.push(input as GenerateInput<unknown>);
    const data = answers.shift();
    if (data === undefined) throw new Error('script exhausted');
    return {
      data,
      raw: JSON.stringify(data),
      usage: { input: 1, cachedInput: 0, output: 1 },
      costUsd: 0,
      replayed: false,
      backend: 'meta',
      model: 'muse-spark-1.3',
      durationMs: 1,
    } as GenerateResult<never>;
  };
  return { call, inputs };
}

describe('batchesOf', () => {
  it('splits ids into batches of the given size, the last one shorter', () => {
    expect(batchesOf(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([
      ['a', 'b'],
      ['c', 'd'],
      ['e'],
    ]);
    expect(batchesOf([], 8)).toEqual([]);
  });
});

describe('assemble', () => {
  it('orders flows as the catalog does and keeps the first definition of every part', () => {
    const extraField = { ...flows.fields[0]!, id: 'FD06', label: 'ISBN' };
    const dupField = { ...flows.fields[2]!, label: 'Book title' }; // FD03 again: the catalog's wins
    const batch1 = {
      flows: [flow('F03'), flow('F01')],
      newFields: [dupField],
      newForms: [],
      newSubflows: [],
    };
    const batch2 = {
      flows: [flow('F02'), flow('F04'), flow('F05'), flow('F06')],
      newFields: [extraField],
      newForms: [],
      newSubflows: [],
    };
    const doc = assemble(catalog, [batch1, batch2]);

    expect(doc.flows.map((candidate) => candidate.id)).toEqual([
      'F01',
      'F02',
      'F03',
      'F04',
      'F05',
      'F06',
    ]);
    expect(doc.fields.find((field) => field.id === 'FD03')?.label).toBe(
      'Title',
    );
    expect(doc.fields.map((field) => field.id)).toContain('FD06');
    expect(doc.forms).toEqual(catalog.forms);
    expect(doc.subflows).toEqual(catalog.subflows);
    expect(Flows.parse(doc)).toBeTruthy();
  });

  it('appends a flow a batch added beyond the catalog', () => {
    const extra = { ...flow('F06'), id: 'F07', name: 'Extra' };
    const doc = assemble(catalog, [
      {
        flows: [...flows.flows, extra],
        newFields: [],
        newForms: [],
        newSubflows: [],
      },
    ]);
    expect(doc.flows.map((candidate) => candidate.id)).toEqual([
      'F01',
      'F02',
      'F03',
      'F04',
      'F05',
      'F06',
      'F07',
    ]);
  });
});

describe('applyPatch', () => {
  it('replaces by id or name, adds what is new, removes what is listed, appends assumptions', () => {
    const renamed = { ...flow('F03'), name: 'Add a book' };
    const patched = applyPatch(flows, {
      ...emptyPatch,
      upsertFlows: [renamed, { ...flow('F06'), id: 'F07', name: 'Extra' }],
      upsertFields: [{ ...flows.fields[2]!, label: 'Book title' }],
      removeFlows: ['F06'],
      assumptions: [{ id: 'A04', text: 'Extra.', kind: 'scope', affects: [] }],
    });
    expect(patched.flows.map((candidate) => candidate.id)).toEqual([
      'F01',
      'F02',
      'F03',
      'F04',
      'F05',
      'F07',
    ]);
    expect(
      patched.flows.find((candidate) => candidate.id === 'F03')?.name,
    ).toBe('Add a book');
    expect(patched.fields.find((field) => field.id === 'FD03')?.label).toBe(
      'Book title',
    );
    expect(patched.fields).toHaveLength(flows.fields.length);
    expect(patched.assumptions.map((assumption) => assumption.id)).toEqual([
      'A03',
      'A04',
    ]);
  });

  it('leaves the document unchanged on an empty patch', () => {
    expect(applyPatch(flows, emptyPatch)).toEqual(flows);
  });
});

describe('expandCompose', () => {
  it('asks for the named flows with the catalog, then fixes in the same conversation', async () => {
    const batch = {
      flows: [flow('F03')],
      newFields: [],
      newForms: [],
      newSubflows: [],
    };
    const { call, inputs } = fakeCall([batch, batch]);
    const compose = expandCompose(
      { system: 'SYSTEM', idea: 'Idea.', scope },
      catalog,
      ['F03'],
      'flows-expand-1',
    );

    const draft = await compose.draft(call);
    expect(draft.data).toEqual(batch);
    expect(inputs[0]?.schemaName).toBe('FlowBatch');
    expect(inputs[0]?.messages[0]?.content).toBe('SYSTEM');
    expect(inputs[0]?.messages[1]?.content).toContain('expand these flows');
    expect(inputs[0]?.messages[1]?.content).toContain('F03');
    expect(inputs[0]?.messages[1]?.content).toContain('"id": "FM01"');

    await compose.fix(
      call,
      draft,
      [
        {
          rule: 'FLOW-011',
          severity: 'mandatory',
          message: 'Add a failure path.',
          at: 'F03.S02',
        },
      ],
      {},
    );
    expect(inputs[1]?.messages).toHaveLength(4);
    expect(inputs[1]?.messages[3]?.content).toContain(
      '- FLOW-011 at F03.S02: Add a failure path.',
    );
  });
});

describe('reconcileCompose', () => {
  it('never drafts, and applies the patch a fix returns', async () => {
    const compose = reconcileCompose(
      { system: 'SYSTEM', idea: 'Idea.', scope },
      'flows-patch',
    );
    const { call: never } = fakeCall([]);
    await expect(compose.draft(never)).rejects.toThrow(/never generates/);

    const patch: FlowsPatch = { ...emptyPatch, removeFlows: ['F06'] };
    const { call, inputs } = fakeCall([patch]);
    const current = {
      data: flows,
      raw: JSON.stringify(flows),
      model: 'muse-spark-1.3',
    };
    const fixed = await compose.fix(
      call,
      current,
      [{ rule: 'FLOW-014', severity: 'mandatory', message: 'x', at: 'flows' }],
      {},
    );
    expect(fixed.data.flows.map((candidate) => candidate.id)).not.toContain(
      'F06',
    );
    expect(inputs[0]?.schemaName).toBe('FlowsPatch');
    expect(inputs[0]?.messages[1]?.content).toContain('patch the document');
    expect(inputs[0]?.messages[1]?.content).toContain('- FLOW-014 at flows: x');
  });
});
