import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { hasArtifact, isStale, readArtifact, writeArtifact } from './artifacts';
import { createRun, readState } from './run';
import { hashOf } from './utils';

const root = mkdtempSync(path.join(tmpdir(), 'weave-artifacts-'));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '# Idea\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const meta = { stage: 'flows-reconcile', model: 'muse-spark-1.3', rounds: 1 };

describe('writeArtifact', () => {
  it('increments the version and records the inputs it was made from', () => {
    const run = createRun({ idea, runsDir: root, id: 'versions' });
    const scope1 = writeArtifact(
      run,
      'flows-scope',
      { name: 'v1' },
      { ...meta, inputs: [] },
    );
    const scope2 = writeArtifact(
      run,
      'flows-scope',
      { name: 'v2' },
      { ...meta, inputs: [] },
    );
    expect([scope1.meta.version, scope2.meta.version]).toEqual([1, 2]);
    expect(scope2.meta).toMatchObject({
      artifact: 'flows-scope',
      stage: 'flows-reconcile',
      model: 'muse-spark-1.3',
      hash: hashOf({ name: 'v2' }),
    });

    const flows = writeArtifact(
      run,
      'flows-reconcile',
      { flows: [] },
      { ...meta, inputs: ['flows-scope'] },
    );
    expect(flows.meta.inputs).toEqual({
      'flows-scope': { version: 2, hash: scope2.meta.hash },
    });
    expect(readArtifact<{ flows: [] }>(run, 'flows-reconcile').data).toEqual({
      flows: [],
    });
    expect(readState(run).stages['flows-reconcile']).toMatchObject({
      status: 'done',
      version: 1,
      hash: flows.meta.hash,
    });
  });

  it('fails clearly when an input or the artifact itself is missing', () => {
    const run = createRun({ idea, runsDir: root, id: 'missing' });
    expect(hasArtifact(run, 'flows-scope')).toBe(false);
    expect(() => readArtifact(run, 'flows-scope')).toThrow(
      /no flows-scope artifact/,
    );
    expect(() =>
      writeArtifact(
        run,
        'flows-reconcile',
        {},
        { ...meta, inputs: ['flows-scope'] },
      ),
    ).toThrow(/no flows-scope artifact/);
  });
});

describe('isStale', () => {
  it('is true after an input changes and false after it is rewritten unchanged', () => {
    const run = createRun({ idea, runsDir: root, id: 'stale' });
    writeArtifact(run, 'flows-scope', { name: 'a' }, { ...meta, inputs: [] });
    writeArtifact(
      run,
      'flows-reconcile',
      { flows: [] },
      { ...meta, inputs: ['flows-scope'] },
    );
    expect(isStale(run, 'flows-reconcile')).toBe(false);

    writeArtifact(run, 'flows-scope', { name: 'b' }, { ...meta, inputs: [] });
    expect(isStale(run, 'flows-reconcile')).toBe(true);

    writeArtifact(
      run,
      'flows-reconcile',
      { flows: [] },
      { ...meta, inputs: ['flows-scope'] },
    );
    writeArtifact(run, 'flows-scope', { name: 'b' }, { ...meta, inputs: [] });
    expect(isStale(run, 'flows-reconcile')).toBe(false);
  });
});
