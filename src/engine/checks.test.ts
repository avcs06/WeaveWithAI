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
        { name: 'design', ok: false, output: 'web/app/(routes)/clients has no code.\nNothing in web/app/(routes)/home calls listClients; load the screen\'s records through it.' },
      ],
    });
    expect(issues.map((i) => i.rule)).toEqual(['CODE-004', 'CODE-001', 'CODE-002', 'CODE-003', 'CODE-007', 'CODE-005', 'CODE-006']);
    expect(issues.find((i) => i.rule === 'CODE-005')?.at).toBe('web/app/(routes)/clients');
    expect(issues.find((i) => i.rule === 'CODE-006')?.at).toBe('web/app/(routes)/home');
    expect(issues.every((i) => i.severity === 'mandatory')).toBe(true);
  });

  it('flags a session that never finished', () => {
    expect(checkIssues({ ...passing, status: 'timeout', summary: '' }).map((i) => i.rule)).toEqual(['CODE-009']);
  });
});

describe('the warnings that never start a fix', () => {
  it('CODE-012 for a file over 300 lines', () => {
    const issues = checkIssues({
      ...passing,
      longFiles: [{ path: 'web/app/(routes)/dashboards/page.tsx', lines: 340 }],
    });
    expect(issues.map((i) => [i.rule, i.severity, i.at])).toEqual([
      ['CODE-012', 'warning', 'web/app/(routes)/dashboards/page.tsx'],
    ]);
  });

  it('none when no file is over 300 lines', () => {
    expect(checkIssues({ ...passing, longFiles: [] })).toEqual([]);
  });
});

describe('a session that reinstalls the packages', () => {
  it('fails CODE-013', () => {
    const issues = checkIssues({ ...passing, status: 'checks', checks: [{ name: 'install', ok: false, output: 'The session changed node_modules.' }] });
    expect(issues.map((i) => [i.rule, i.severity])).toEqual([['CODE-013', 'mandatory']]);
  });
});

describe('a component used without its recipe', () => {
  it('fails CODE-014, naming the file and the recipe to read', () => {
    const issues = checkIssues({ ...passing, unreadRecipes: [{ component: 'Avatar', file: 'web/app/components/AccountMenu/AccountMenu.tsx' }] });
    expect(issues).toEqual([
      expect.objectContaining({ rule: 'CODE-014', severity: 'mandatory', at: 'web/app/components/AccountMenu/AccountMenu.tsx', message: expect.stringContaining('get_recipe Avatar') }),
    ]);
  });
});
