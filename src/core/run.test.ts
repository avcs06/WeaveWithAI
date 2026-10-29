import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { appendEvent, createRun, openRun, readEvents, readState, runId, runPath, totals, updateStage } from './run';

const root = mkdtempSync(path.join(tmpdir(), 'weave-run-'));
const idea = path.join(root, 'Project Tracker.md');
writeFileSync(idea, '# Project tracker\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

function freshRun(id: string) {
  return createRun({ idea, runsDir: path.join(root, 'runs'), id });
}

describe('runId', () => {
  it('is date, time and the kebab-cased idea name', () => {
    expect(runId(idea, new Date(2026, 9, 28, 20, 10))).toBe('20261028-2010-project-tracker');
  });
});

describe('createRun and openRun', () => {
  it('copies the idea in and writes state.json', () => {
    const run = freshRun('r1');
    expect(readFileSync(runPath(run, 'input', 'idea.md'), 'utf8')).toBe('# Project tracker\n');
    expect(readState(run)).toMatchObject({ id: 'r1', idea, stages: {} });
    expect(openRun('r1', path.join(root, 'runs'))).toEqual(run);
    expect(() => openRun('missing', path.join(root, 'runs'))).toThrow(/No run missing/);
  });

  it('records a stage patch with a timestamp and leaves no temp file behind', () => {
    const run = freshRun('r2');
    updateStage(run, 'flows', { status: 'running' });
    updateStage(run, 'flows', { status: 'done', version: 1, rounds: 2 });
    expect(readState(run).stages.flows).toMatchObject({ status: 'done', version: 1, rounds: 2 });
    expect(readState(run).stages.flows?.updatedAt).toMatch(/^\d{4}-/);
    expect(existsSync(runPath(run, 'state.json.tmp'))).toBe(false);
  });
});

describe('events', () => {
  it('appends in order and totals only llm:call events', () => {
    const run = freshRun('r3');
    appendEvent(run, { type: 'stage:start', stage: 'flows' });
    appendEvent(run, { type: 'llm:call', stage: 'flows', input: 100, output: 50, costUsd: 0.001 });
    appendEvent(run, { type: 'llm:call', stage: 'flows', input: 10, output: 5, costUsd: 0.0005 });
    const events = readEvents(run);
    expect(events.map((event) => event.type)).toEqual(['stage:start', 'llm:call', 'llm:call']);
    expect(events[0]?.ts).toMatch(/^\d{4}-/);
    expect(totals(run)).toEqual({ calls: 2, input: 110, output: 55, costUsd: 0.0015 });
  });

  it('reads an empty list when nothing was logged', () => {
    expect(readEvents(freshRun('r4'))).toEqual([]);
  });
});
