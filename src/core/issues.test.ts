import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { formatForModel, formatForTerminal, type Issue, readReport, splitIssues, writeReport } from './issues';
import { createRun } from './run';

const root = mkdtempSync(path.join(tmpdir(), 'weave-issues-'));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '# Idea\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const issues: Issue[] = [
  { rule: 'FLOW-001', severity: 'mandatory', message: 'needs a start screen', at: 'F03' },
  { rule: 'FLOW-007', severity: 'warning', message: 'long flow' },
  { rule: 'SCOPE-002', severity: 'mandatory', message: 'unsupported capability' },
];

describe('splitIssues', () => {
  it('separates mandatory issues from warnings', () => {
    const { mandatory, warnings } = splitIssues(issues);
    expect(mandatory.map((issue) => issue.rule)).toEqual(['FLOW-001', 'SCOPE-002']);
    expect(warnings.map((issue) => issue.rule)).toEqual(['FLOW-007']);
  });
});

describe('formatting', () => {
  it('sends the model only mandatory issues, one per line, with the location when known', () => {
    expect(formatForModel(issues)).toBe(
      '- FLOW-001 at F03: needs a start screen\n- SCOPE-002: unsupported capability',
    );
    expect(formatForModel([])).toBe('');
  });

  it('prints counts first and groups by severity for the terminal', () => {
    const text = formatForTerminal(issues);
    expect(text.split('\n')[0]).toBe('2 mandatory, 1 warning');
    expect(text).toContain('Mandatory:\n  FLOW-001 at F03: needs a start screen');
    expect(text).toContain('Warnings:\n  FLOW-007: long flow');
    expect(formatForTerminal([])).toBe('0 mandatory, 0 warnings');
  });
});

describe('reports', () => {
  it('keeps one entry per round and reads nothing before a write', () => {
    const run = createRun({ idea, runsDir: root, id: 'report' });
    expect(readReport(run, 'flows')).toBeUndefined();
    writeReport(run, 'flows', 1, issues);
    writeReport(run, 'flows', 2, []);
    expect(readReport(run, 'flows')).toEqual({
      rounds: [
        { round: 1, issues },
        { round: 2, issues: [] },
      ],
    });
  });
});
