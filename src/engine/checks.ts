import type { Issue } from '../core/issues';
import type { SessionResult } from './session';

// The checks after a coding session as issues (CD5), so the rounds, the
// reports and the fix task treat them like validator issues. Pure.

/** Each check's rule: CODE-005 and CODE-006 split the design check by what it found. */
const RULE_OF: Record<string, string> = {
  validate: 'CODE-001',
  typecheck: 'CODE-002',
  lint: 'CODE-003',
  verify: 'CODE-007',
  build: 'CODE-008',
};

const issue = (rule: string, message: string, at?: string): Issue =>
  at === undefined ? { rule, severity: 'mandatory', message } : { rule, severity: 'mandatory', message, at };

/** A failed session check, a write outside the session's paths, or a session that never finished, each a mandatory issue; a read the guidelines rule out, a warning. */
export function checkIssues(
  result: Pick<SessionResult, 'status' | 'summary' | 'checks' | 'protectedHits'> & Partial<Pick<SessionResult, 'readsOutside'>>,
): Issue[] {
  const issues: Issue[] = result.protectedHits.map((file) =>
    issue('CODE-004', `${file} is outside this session's paths, or a test. Undo the change to it.`, file),
  );
  for (const file of result.readsOutside ?? [])
    issues.push({
      rule: 'CODE-010',
      severity: 'warning',
      message: `The session read ${file}, which its guidelines keep it from: ask the MCP, or read only what the task uses.`,
      at: file,
    });
  for (const check of result.checks.filter((c) => !c.ok)) {
    if (check.name !== 'design') {
      const rule = RULE_OF[check.name] ?? 'CODE-001';
      issues.push(issue(rule, `${check.name} failed:\n${check.output.trim()}`));
      continue;
    }
    for (const line of check.output.split('\n').filter(Boolean))
      issues.push(issue(line.includes(' calls ') ? 'CODE-006' : 'CODE-005', line, line.match(/"([^"]+)"/)?.[1]));
  }
  if (result.status === 'timeout' || result.status === 'failed')
    issues.push(issue('CODE-009', `The session did not finish (${result.status}): ${result.summary || 'no summary'}`));
  return issues;
}
