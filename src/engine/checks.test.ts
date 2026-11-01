import { describe, expect, it } from 'vitest';
import { checkIssues } from './checks';

const passing = { status: 'done' as const, summary: 'built it', protectedHits: [], checks: [{ name: 'typecheck', ok: true, output: '' }] };

describe('checks as issues', () => {
  it('gives a passing session no issue', () => {
    expect(checkIssues(passing)).toEqual([]);
  });

  it('names each failed check by its rule, and splits the design check by what it found', () => {
    const issues = checkIssues({
      ...passing,
      status: 'checks',
      protectedHits: ['web/app/blocks/Header/Header.tsx'],
      checks: [
        { name: 'validate', ok: false, output: 'FAIL page.tsx' },
        { name: 'typecheck', ok: false, output: 'error TS2304' },
        { name: 'lint', ok: false, output: '1 error' },
        { name: 'verify', ok: false, output: 'overflow at 1280' },
        { name: 'design', ok: false, output: 'No element has data-testid "S04.n02".\nNothing in web/app/(routes)/home calls listClients; load the widget\'s data through it.' },
      ],
    });
    expect(issues.map((i) => i.rule)).toEqual(['CODE-004', 'CODE-001', 'CODE-002', 'CODE-003', 'CODE-007', 'CODE-005', 'CODE-006']);
    expect(issues.find((i) => i.rule === 'CODE-005')?.at).toBe('S04.n02');
    expect(issues.every((i) => i.severity === 'mandatory')).toBe(true);
  });

  it('flags a session that never finished', () => {
    expect(checkIssues({ ...passing, status: 'timeout', summary: '' }).map((i) => i.rule)).toEqual(['CODE-009']);
  });
});

describe('reads the guidelines rule out', () => {
  it('are warnings, so they never start a fix session', () => {
    const issues = checkIssues({ ...passing, readsOutside: ['packages/ui/src/Dialog/Dialog.tsx'] });
    expect(issues).toEqual([expect.objectContaining({ rule: 'CODE-010', severity: 'warning', at: 'packages/ui/src/Dialog/Dialog.tsx' })]);
  });
});

describe('the warnings that never start a fix', () => {
  it("CODE-011 for a node's words missing, CODE-012 for a file over 300 lines", () => {
    const issues = checkIssues({
      ...passing,
      checks: [{ name: 'design', ok: true, output: 'The words "Dashboards" of S04.n01 are nowhere in web/app/(routes)/dashboards; show the node\'s text as the design writes it.' }],
      longFiles: [{ path: 'web/app/(routes)/dashboards/page.tsx', lines: 340 }],
    });
    expect(issues.map((i) => [i.rule, i.severity, i.at])).toEqual([
      ['CODE-012', 'warning', 'web/app/(routes)/dashboards/page.tsx'],
      ['CODE-011', 'warning', 'S04.n01'],
    ]);
  });

  it('none for a file at 300 lines or a check with every word shown', () => {
    expect(checkIssues({ ...passing, longFiles: [] })).toEqual([]);
  });
});

describe('a session that reinstalls the packages', () => {
  it('fails CODE-013', () => {
    const issues = checkIssues({ ...passing, status: 'checks', checks: [{ name: 'install', ok: false, output: 'The session changed node_modules.' }] });
    expect(issues.map((i) => [i.rule, i.severity])).toEqual([['CODE-013', 'mandatory']]);
  });
});
