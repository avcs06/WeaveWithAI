import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { type Issue, readReport } from './issues';
import type { GenerateInput, Llm } from './llm';
import { createRun, readEvents, readState } from './run';
import { runSpecStage, StageFailed } from './runSpecStage';

const root = mkdtempSync(path.join(tmpdir(), 'weave-stage-'));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '# Idea\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const Doc = z.object({ title: z.string() });
type Doc = z.infer<typeof Doc>;

const missingTitle: Issue = { rule: 'DOC-001', severity: 'mandatory', message: 'title must not be empty', at: 'title' };
const longTitle: Issue = { rule: 'DOC-002', severity: 'warning', message: 'title is long' };

/** An llm that returns scripted outputs and keeps every input it was given. */
function fakeLlm(outputs: Doc[]) {
  const inputs: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      inputs.push(input as GenerateInput<unknown>);
      const data = outputs[inputs.length - 1];
      if (!data) throw new Error('script exhausted');
      const model = input.model === 'strong' ? 'muse-wonder-1.0' : 'muse-spark-1.3';
      return {
        data: data as never,
        raw: JSON.stringify(data),
        usage: { input: 10, cachedInput: 0, output: 5 },
        costUsd: 0.001,
        replayed: false,
        backend: 'meta',
        model,
        durationMs: 1,
      };
    },
  };
  return { llm, inputs };
}

function stage(id: string, llm: Llm, validate: (doc: Doc) => Issue[]) {
  const run = createRun({ idea, runsDir: root, id });
  const promise = runSpecStage({
    run,
    stage: 'doc',
    schema: Doc,
    schemaName: 'Doc',
    system: 'Write a doc.',
    user: 'About cats.',
    validate,
    llm,
  });
  return { run, promise };
}

const requireTitle = (doc: Doc): Issue[] => (doc.title ? [] : [missingTitle]);

describe('runSpecStage', () => {
  it('sends only the mandatory issues back and succeeds in round 2', async () => {
    const { llm, inputs } = fakeLlm([{ title: '' }, { title: 'Cats' }]);
    const { promise } = stage('fixed', llm, (doc) => [...requireTitle(doc), longTitle]);
    const result = await promise;

    expect(result).toEqual({ output: { title: 'Cats' }, warnings: [longTitle], rounds: 2 });
    expect(inputs).toHaveLength(2);
    expect(inputs.map((input) => input.model)).toEqual(['default', 'default']);
    const messages = inputs[1]?.messages ?? [];
    expect(messages.slice(0, 2)).toEqual([
      { role: 'system', content: 'Write a doc.' },
      { role: 'user', content: 'About cats.' },
    ]);
    expect(messages[2]).toEqual({ role: 'assistant', content: '{"title":""}' });
    expect(messages[3]?.role).toBe('user');
    expect(messages[3]?.content).toContain('return the complete corrected JSON');
    expect(messages[3]?.content).toContain('- DOC-001 at title: title must not be empty');
    expect(messages[3]?.content).not.toContain('DOC-002');
  });

  it('escalates to the strong model in round 3 and fails with the last mandatory issues', async () => {
    const { llm, inputs } = fakeLlm([{ title: '' }, { title: '' }, { title: '' }]);
    const { run, promise } = stage('failed', llm, requireTitle);
    const error: unknown = await promise.catch((e: unknown) => e);

    expect(error).toBeInstanceOf(StageFailed);
    expect(error as StageFailed).toMatchObject({ stage: 'doc', rounds: 3, issues: [missingTitle] });
    expect(inputs.map((input) => input.model)).toEqual(['default', 'default', 'strong']);
    expect(readState(run).stages.doc?.status).toBe('failed');

    expect(readReport(run, 'doc')?.rounds.map((entry) => entry.round)).toEqual([1, 2, 3]);
    const types = readEvents(run).map((event) => event.type);
    expect(types).toEqual([
      'stage:start',
      'llm:call', 'stage:round',
      'llm:call', 'stage:round',
      'llm:call', 'stage:round',
      'stage:failed',
    ]);
    expect(readEvents(run).filter((event) => event.type === 'llm:call').map((event) => event.model)).toEqual([
      'muse-spark-1.3', 'muse-spark-1.3', 'muse-wonder-1.0',
    ]);
  });

  it('ends in round 1 on warnings alone and returns them', async () => {
    const { llm, inputs } = fakeLlm([{ title: 'Cats' }]);
    const { run, promise } = stage('warned', llm, () => [longTitle]);
    const result = await promise;

    expect(result).toEqual({ output: { title: 'Cats' }, warnings: [longTitle], rounds: 1 });
    expect(inputs).toHaveLength(1);
    expect(readEvents(run).map((event) => event.type)).toEqual(['stage:start', 'llm:call', 'stage:round', 'stage:done']);
    expect(readReport(run, 'doc')).toEqual({ rounds: [{ round: 1, issues: [longTitle] }] });
  });
});
