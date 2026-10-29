import { existsSync, readFileSync } from 'node:fs';
import { type Run, runPath, writeJsonAtomic } from './run';

export type Severity = 'mandatory' | 'warning';
export type Owner = 'flows' | 'design' | 'contract';
export type Issue = {
  rule: string;
  severity: Severity;
  message: string;
  at?: string;
  owner?: Owner;
};
export type Report = { rounds: { round: number; issues: Issue[] }[] };

export function splitIssues(issues: Issue[]): { mandatory: Issue[]; warnings: Issue[] } {
  return {
    mandatory: issues.filter((issue) => issue.severity === 'mandatory'),
    warnings: issues.filter((issue) => issue.severity === 'warning'),
  };
}

export function readReport(run: Run, stage: string): Report | undefined {
  const file = runPath(run, 'reports', `${stage}.json`);
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, 'utf8')) as Report;
}

export function writeReport(run: Run, stage: string, round: number, issues: Issue[]): void {
  const report = readReport(run, stage) ?? { rounds: [] };
  // Rerunning a round replaces its entry instead of adding a duplicate.
  const rounds = report.rounds.filter((entry) => entry.round !== round);
  rounds.push({ round, issues });
  rounds.sort((a, b) => a.round - b.round);
  writeJsonAtomic(runPath(run, 'reports', `${stage}.json`), { rounds });
}

/** One `- RULE at ID: message` line per issue, the way issues go to the model. */
export function formatIssues(issues: Issue[]): string {
  return issues.map((issue) => `- ${describe(issue)}`).join('\n');
}

/** Mandatory issues only. */
export function formatForModel(issues: Issue[]): string {
  return formatIssues(splitIssues(issues).mandatory);
}

export function formatForTerminal(issues: Issue[]): string {
  const { mandatory, warnings } = splitIssues(issues);
  const lines = [`${mandatory.length} mandatory, ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}`];
  for (const [title, list] of [
    ['Mandatory', mandatory],
    ['Warnings', warnings],
  ] as const) {
    if (list.length === 0) continue;
    lines.push('', `${title}:`, ...list.map((issue) => `  ${describe(issue)}`));
  }
  return lines.join('\n');
}

function describe(issue: Issue): string {
  return `${issue.rule}${issue.at ? ` at ${issue.at}` : ''}: ${issue.message}`;
}
