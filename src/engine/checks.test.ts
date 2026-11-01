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
