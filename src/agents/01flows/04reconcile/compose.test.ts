import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { GenerateInput, GenerateResult } from '../../../core/llm';
import { applyPatch } from '../../../runner/patch';
import type { Call } from '../../../runner/runSpecStage';
import { Scope } from '../01scope/schema';
import { type Flow, Flows } from '../schema';
import { reconcileCompose } from './compose';
import { FLOWS_KEYS, type FlowsPatch } from './schema';

const load = (name: string): unknown =>
  JSON.parse(
    readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url), 'utf8'),
  );

const scope = Scope.parse(load('reading-list.scope.json'));

const flows = Flows.parse(load('reading-list.flows.json'));

const flow = (id: string): Flow => {
  const found = flows.flows.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`no ${id}`);
  return found;
};

const none = { upsert: [], remove: [] };
const emptyPatch: FlowsPatch = {
  flows: none,
  fields: none,
  forms: none,
  subflows: none,
  assumptions: none,
  questions: none,
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

describe('the flows patch', () => {
  it('replaces by id, adds what is new, removes what is listed, adds assumptions', () => {
    const renamed = { ...flow('F03'), name: 'Add a book' };
    const patch: FlowsPatch = {
      ...emptyPatch,
      flows: {
        upsert: [renamed, { ...flow('F06'), id: 'F07', name: 'Extra' }],
        remove: ['F06'],
      },
      fields: { upsert: [{ ...flows.fields[2]!, label: 'Book title' }], remove: [] },
      assumptions: {
        upsert: [{ id: 'A04', text: 'Extra.', kind: 'scope', affects: [] }],
        remove: [],
      },
    };
    const patched = applyPatch(flows, patch, FLOWS_KEYS);
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
    expect(applyPatch(flows, emptyPatch, FLOWS_KEYS)).toEqual(flows);
  });

  it('removes a field as well as a flow', () => {
    const patched = applyPatch(
      flows,
      { ...emptyPatch, fields: { upsert: [], remove: ['FD03'] } },
      FLOWS_KEYS,
    );
    expect(patched.fields.map((field) => field.id)).not.toContain('FD03');
    expect(patched.fields).toHaveLength(flows.fields.length - 1);
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

    const patch: FlowsPatch = {
      ...emptyPatch,
      flows: { upsert: [], remove: ['F06'] },
    };
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
    expect(inputs[0]?.messages[1]?.content).toContain('- `remove`: the keys');
    expect(inputs[0]?.messages[1]?.content).toContain('- FLOW-014 at flows: x');
  });
});
