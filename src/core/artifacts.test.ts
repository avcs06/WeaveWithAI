import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { canonicalJson, hasArtifact, hashOf, isStale, readArtifact, writeArtifact } from './artifacts';
import { createRun, readState } from './run';

const root = mkdtempSync(path.join(tmpdir(), 'weave-artifacts-'));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '# Idea\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const meta = { stage: 'flows', model: 'muse-spark-1.3', rounds: 1 };

describe('hashOf', () => {
  it('does not depend on key order, including inside arrays', () => {
    expect(hashOf({ a: 1, b: [1, { c: 2, d: 3 }] })).toBe(hashOf({ b: [1, { d: 3, c: 2 }], a: 1 }));
    expect(canonicalJson({ b: 1, a: [{ z: 0, y: 1 }] })).toBe('{"a":[{"y":1,"z":0}],"b":1}');
    expect(hashOf({ a: 1 })).not.toBe(hashOf({ a: 2 }));
  });
});

describe('writeArtifact', () => {
  it('increments the version and records the inputs it was made from', () => {
    const run = createRun({ idea, runsDir: root, id: 'versions' });
    const scope1 = writeArtifact(run, 'scope', { name: 'v1' }, { ...meta, inputs: [] });
    const scope2 = writeArtifact(run, 'scope', { name: 'v2' }, { ...meta, inputs: [] });
    expect([scope1.meta.version, scope2.meta.version]).toEqual([1, 2]);
    expect(scope2.meta).toMatchObject({ artifact: 'scope', stage: 'flows', model: 'muse-spark-1.3', hash: hashOf({ name: 'v2' }) });

    const flows = writeArtifact(run, 'flows', { flows: [] }, { ...meta, inputs: ['scope'] });
    expect(flows.meta.inputs).toEqual({ scope: { version: 2, hash: scope2.meta.hash } });
    expect(readArtifact<{ flows: [] }>(run, 'flows').data).toEqual({ flows: [] });
    expect(readState(run).stages.flows).toMatchObject({ status: 'done', version: 1, hash: flows.meta.hash });
  });

  it('fails clearly when an input or the artifact itself is missing', () => {
    const run = createRun({ idea, runsDir: root, id: 'missing' });
    expect(hasArtifact(run, 'scope')).toBe(false);
    expect(() => readArtifact(run, 'scope')).toThrow(/no scope artifact/);
    expect(() => writeArtifact(run, 'flows', {}, { ...meta, inputs: ['scope'] })).toThrow(/no scope artifact/);
  });
});

describe('isStale', () => {
  it('is true after an input changes and false after it is rewritten unchanged', () => {
    const run = createRun({ idea, runsDir: root, id: 'stale' });
    writeArtifact(run, 'scope', { name: 'a' }, { ...meta, inputs: [] });
    writeArtifact(run, 'flows', { flows: [] }, { ...meta, inputs: ['scope'] });
    expect(isStale(run, 'flows')).toBe(false);

    writeArtifact(run, 'scope', { name: 'b' }, { ...meta, inputs: [] });
    expect(isStale(run, 'flows')).toBe(true);

    writeArtifact(run, 'flows', { flows: [] }, { ...meta, inputs: ['scope'] });
    writeArtifact(run, 'scope', { name: 'b' }, { ...meta, inputs: [] });
    expect(isStale(run, 'flows')).toBe(false);
  });
});
