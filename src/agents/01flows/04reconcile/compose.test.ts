import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { GenerateInput, GenerateResult } from '../../../core/llm';
import type { Call } from '../../../runner/runSpecStage';
import { Scope } from '../01scope/schema';
import { type Flow, Flows } from '../schema';
import { applyPatch, reconcileCompose } from './compose';
import type { FlowsPatch } from './schema';

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
