import type { Issue } from '../core/issues';
import type { UnreadRecipe } from './recipes';
import type { SessionResult } from './session';

// The checks after a coding session as issues, so the rounds, the
// reports and the fix task treat them like validator issues. Pure.

/** Each check's rule: CODE-005 and CODE-006 split the design check by what it found. */
const RULE_OF: Record<string, string> = {
  validate: 'CODE-001',
  typecheck: 'CODE-002',
  lint: 'CODE-003',
  verify: 'CODE-007',
  build: 'CODE-008',
  install: 'CODE-013',
};

/** The longest file a session should write, as AGENTS.md sets for this repo. */
export const MAX_LINES = 300;

/** A file the unit changed, over MAX_LINES. */
export type LongFile = { path: string; lines: number };

const issue = (rule: string, message: string, at?: string): Issue =>
  at === undefined ? { rule, severity: 'mandatory', message } : { rule, severity: 'mandatory', message, at };

/** A failed session check, a write outside the session's paths, a component used without its recipe, or a session that never finished, each a mandatory issue; a read the guidelines rule out, a warning. */
export function checkIssues(
  result: Pick<SessionResult, 'status' | 'summary' | 'checks' | 'protectedHits'> &
    Partial<Pick<SessionResult, 'readsOutside'>> & { longFiles?: LongFile[]; unreadRecipes?: UnreadRecipe[] },
): Issue[] {
  const issues: Issue[] = result.protectedHits.map((file) =>
    issue('CODE-004', `${file} is a test or a protected path (tools, config, .weave, a frame's layout.tsx). Undo the change to it.`, file),
  );
  for (const { component, file } of result.unreadRecipes ?? [])
    issues.push(
      issue('CODE-014', `${file} uses ${component} without its recipe read. Call get_recipe ${component}, then build it as the case that fits.`, file),
    );
  for (const { path, lines } of result.longFiles ?? [])
    issues.push({
      rule: 'CODE-012',
      severity: 'warning',
      message: `${path} is ${lines} lines. Split it into files of at most ${MAX_LINES} lines, each with one job.`,
      at: path,
    });
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
    // Each line names the screen's route folder: "<folder> has no code." or "Nothing in <folder> calls <operation>; ...".
    for (const line of check.output.split('\n').filter(Boolean))
      issues.push(issue(line.includes(' calls ') ? 'CODE-006' : 'CODE-005', line, line.match(/^(?:Nothing in )?(\S+) (?:has no code|calls )/)?.[1]));
  }
  if (result.status === 'timeout' || result.status === 'failed')
    issues.push(issue('CODE-009', `The session did not finish (${result.status}): ${result.summary || 'no summary'}`));
  return issues;
}
