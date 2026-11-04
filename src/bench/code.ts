import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import { type Run, runPath } from '../core/run';

// The app's code as numbers: type errors, lint and design-system findings,
// duplicated code, long files, and whose lines they are. Each tool runs in the
// app the way the coding gate runs it, over every file under web/app.

export type CodeReport = {
  files: number;
  lines: number;
  tsc: { errors: number };
  eslint: { errors: number; warnings: number; byRule: Record<string, number> };
  validate: { errors: number; warnings: number; byRule: Record<string, number> };
  clones: { percentage: number; count: number; maxLines: number };
  longFiles: number;
  linesByOrigin: { template: number; code: number; model: number };
};

/** A file the gate's CODE-012 calls too long. */
const LONG_FILE = 300;
const SOURCE = /\.tsx?$/;
const TEST = /(^|\/)__tests__\/|\.(test|spec)\.tsx?$/;

/** Every source file under web/app, app-relative, tests left out. */
function sourceFiles(appDir: string, dir = 'web/app'): string[] {
  return readdirSync(path.join(appDir, dir)).flatMap((name) => {
    const file = path.posix.join(dir, name);
    if (statSync(path.join(appDir, file)).isDirectory()) return sourceFiles(appDir, file);
    return SOURCE.test(name) && !TEST.test(file) ? [file] : [];
  });
}

const lineCount = (text: string) => text.split('\n').length - (text.endsWith('\n') ? 1 : 0);

/** `ok   path` and `FAIL path` lines, each finding under its file as `line:col severity rule: message`. */
export function parseValidate(text: string): CodeReport['validate'] {
  const report: CodeReport['validate'] = { errors: 0, warnings: 0, byRule: {} };
  for (const match of text.matchAll(/^\s+\d+:\d+ (error|warning) ([\w-]+):/gm)) {
    if (match[1] === 'error') report.errors += 1;
    else report.warnings += 1;
    report.byRule[match[2]!] = (report.byRule[match[2]!] ?? 0) + 1;
  }
  return report;
}

/** ESLint's JSON formatter: one entry per file with its messages; severity 2 is an error. */
export function summarizeEslint(results: { messages: { ruleId: string | null; severity: number }[] }[]): CodeReport['eslint'] {
  const report: CodeReport['eslint'] = { errors: 0, warnings: 0, byRule: {} };
  for (const message of results.flatMap((result) => result.messages)) {
    if (message.severity === 2) report.errors += 1;
    else report.warnings += 1;
    const rule = message.ruleId ?? 'parse';
    report.byRule[rule] = (report.byRule[rule] ?? 0) + 1;
  }
  return report;
}

/** jscpd's JSON report: the duplicated share of lines, and each clone's length. */
export function parseJscpd(report: { statistics: { total: { percentage: number } }; duplicates: { lines: number }[] }): CodeReport['clones'] {
  return {
    percentage: report.statistics.total.percentage,
    count: report.duplicates.length,
    maxLines: Math.max(0, ...report.duplicates.map((clone) => clone.lines)),
  };
}

/** A file's lines count under the origin of its last ledger entry; a file the ledger never names is the template's. */
export function linesByOrigin(lines: Record<string, number>, ledger: { path: string; origin: string }[]): CodeReport['linesByOrigin'] {
  const origin = new Map(ledger.map((entry) => [entry.path, entry.origin]));
  const counts = { template: 0, code: 0, model: 0 };
  for (const [file, n] of Object.entries(lines)) {
    const by = origin.get(file);
    counts[by === 'model' ? 'model' : by === 'code' ? 'code' : 'template'] += n;
  }
  return counts;
}

export async function runCodeQuality(run: Run): Promise<CodeReport> {
  const appDir = runPath(run, 'app');
  const files = sourceFiles(appDir);
  const lines = Object.fromEntries(files.map((file) => [file, lineCount(readFileSync(path.join(appDir, file), 'utf8'))]));
  const ledgerFile = path.join(appDir, '.weave', 'ledger.json');
  const ledger = existsSync(ledgerFile) ? JSON.parse(readFileSync(ledgerFile, 'utf8')) : [];

  const tsc = await execa('pnpm', ['typecheck'], { cwd: appDir, reject: false, all: true });
  // The lint target's own command, `eslint .` in web; `pnpm exec` would run it from the app root, where web is ignored.
  const eslint = await execa(path.join(appDir, 'node_modules', '.bin', 'eslint'), ['.', '--format', 'json'], { cwd: path.join(appDir, 'web'), reject: false });
  const validate = await execa('node', ['tools/validate-files.mjs', ...files], { cwd: appDir, reject: false });
  const jscpdDir = runPath(run, 'benchmark', 'jscpd');
  mkdirSync(jscpdDir, { recursive: true });
  await execa(
    path.resolve('node_modules', '.bin', 'jscpd'),
    ['web/app', '--min-tokens', '50', '--min-lines', '5', '--reporters', 'json', '--output', path.resolve(jscpdDir), '--ignore', '**/*.test.*,**/__tests__/**,**/node_modules/**,**/.next/**', '--silent'],
    { cwd: appDir, reject: false },
  );

  return {
    files: files.length,
    lines: Object.values(lines).reduce((a, b) => a + b, 0),
    tsc: { errors: (String(tsc.all).match(/error TS\d+/g) ?? []).length },
    eslint: summarizeEslint(JSON.parse(eslint.stdout || '[]')),
    validate: parseValidate(validate.stdout),
    clones: parseJscpd(JSON.parse(readFileSync(path.join(jscpdDir, 'jscpd-report.json'), 'utf8'))),
    longFiles: Object.values(lines).filter((n) => n > LONG_FILE).length,
    linesByOrigin: linesByOrigin(lines, ledger),
  };
}
