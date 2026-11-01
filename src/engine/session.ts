import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import { resolveBackend } from '../core/backends';
import { costUsd } from '../core/prices';
import { appendEvent, runPath } from '../core/run';
import type { StageContext } from '../agents/stages';
import { checkScreen, type ScreenExpect } from './conformance';
import { dockerArgs, ensureAgentImage, museDir } from './docker';
import { appendLedger } from './ledger';
import { museArgs, readUsage } from './muse';
import { git } from './setup';

// One coding session on Muse Code headless (D9.1 A). The agent may read and
// edit anything in the app; this code judges the result: it reruns the
// checks, records the diff in the ledger, and fails a session whose diff
// touches a test or a protected path.

export type Session = {
  /** 'page:S04', 'component:WidgetBoard', 'repair:R03' */
  id: string;
  /** The short prompt: it names the `.weave/` input files and the guidelines. */
  task: string;
  /** Written to `.weave/<name>` before the run; strings as is, anything else as JSON. */
  inputs: Record<string, unknown>;
  /** The route `pnpm verify` checks. */
  route?: string;
  /** What the screen's route folder must name, from its design and the contract. */
  expect?: ScreenExpect;
  /** More globs the diff must not touch; tests and `PROTECTED` always are. */
  protect?: string[];
  /** The only paths the diff may touch, when given (CD5): each code stage writes its own folders. */
  writes?: string[];
  /** Paths the guidelines keep the agent from reading; a read there is a warning, since reading can't be blocked. */
  reads?: ReadRules;
  maxSteps?: number;
  timeoutMs?: number;
};

export type Check = { name: string; ok: boolean; output: string };

/** Paths a session should not read (`deny`), except those `allow` names. */
export type ReadRules = { deny: string[]; allow?: string[] };

export type SessionResult = {
  status: 'done' | 'failed' | 'checks' | 'protected' | 'timeout';
  summary: string;
  changed: string[];
  protectedHits: string[];
  /** Files the agent read that its read rules keep it from. */
  readsOutside: string[];
  usage: { calls: number; input: number; cached: number; output: number; reasoning: number };
  costUsd: number;
  checks: Check[];
};

/** Tests swap the executable and the check runner. */
export type SessionDeps = {
  bin?: string[];
  runCheck?: (appDir: string, name: string, args: string[]) => Promise<Check>;
};

const TESTS = /(^|\/)(__tests__|e2e)\/|\.(test|spec)\.tsx?$/;
/** What the guidelines tell the agent never to change. */
const PROTECTED = ['packages/**', 'tools/**', '.muse/**', '.mcp.json', '.weave/**'];
const OURS = new Set(['.weave/hook.log', '.weave/ledger.json', '.weave/tools.log']);
const TOOLS_LOG = '.weave/tools.log';

/**
 * A path rule: `folder/**` covers everything under the folder, anything else
 * one file. Literal, not a glob: route folders such as `[clientId]` and
 * `(routes)` are names, not patterns.
 */
export function inPath(file: string, rule: string): boolean {
  return rule.endsWith('/**') ? file.startsWith(rule.slice(0, -2)) : file === rule;
}

/** The app files a tool log shows the agent reading: read tools' paths, and paths in its shell commands. */
export function readPaths(log: string, appDir: string): string[] {
  const root = path.resolve(appDir);
  const relative = (raw: string) => {
    const clean = raw.replace(/\\/g, '').replace(/[*:,]+$/, '');
    const rel = clean.startsWith('/app/') ? clean.slice(5) : clean.startsWith(`${root}/`) ? clean.slice(root.length + 1) : clean;
    return rel.replace(/^\.\//, '');
  };
  const paths = new Set<string>();
  for (const line of log.split('\n').filter(Boolean)) {
    let entry: { tool?: string; path?: string; command?: string };
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.path && /read|view|open/i.test(entry.tool ?? '')) paths.add(relative(entry.path));
    for (const token of (entry.command ?? '').split(/[\s;|&<>'"`]+/))
      if (!token.startsWith('-') && !/^[a-z]+:\/\//.test(token) && (token.includes('/') || /\.(tsx?|jsx?|cjs|mjs|json|css)$/.test(token)))
        paths.add(relative(token));
  }
  return [...paths].filter((p) => p && !p.startsWith('/') && !p.startsWith('..'));
}
const MAX_OUTPUT_LINES = 200;

/** The changed files a session may not touch: tests, `PROTECTED`, its own protect globs, and anything outside its write paths. */
export function protectedOf(changed: string[], session: Pick<Session, 'protect' | 'writes'>): string[] {
  const outside = (file: string) => session.writes !== undefined && !session.writes.some((rule) => inPath(file, rule));
  return changed.filter(
    (file) => TESTS.test(file) || [...PROTECTED, ...(session.protect ?? [])].some((rule) => inPath(file, rule)) || outside(file),
  );
}

export async function appCheck(appDir: string, name: string, args: string[]): Promise<Check> {
  const [cmd = 'pnpm', ...rest] = args;
  const result = await execa(cmd, rest, { cwd: appDir, reject: false, all: true });
  const output = String(result.all ?? '').split('\n').slice(-MAX_OUTPUT_LINES).join('\n');
  return { name, ok: result.exitCode === 0, output };
}

export async function runSession(
  ctx: StageContext,
  appDir: string,
  session: Session,
  deps: SessionDeps = {},
): Promise<SessionResult> {
  const { run } = ctx;
  const backend = resolveBackend(ctx.config, ctx.backend);
  const slug = session.id.replace(/[^a-zA-Z0-9]+/g, '-');
  const at = (...parts: string[]) => path.join(appDir, ...parts);

  for (const [name, value] of Object.entries(session.inputs)) {
    mkdirSync(path.dirname(at('.weave', name)), { recursive: true });
    writeFileSync(at('.weave', name), typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  }
  const promptFile = `.weave/tasks/${slug}.md`;
  mkdirSync(at('.weave', 'tasks'), { recursive: true });
  writeFileSync(at(promptFile), `${session.task}\n`);
  git(appDir, 'add', '-A');
  git(appDir, 'commit', '-q', '--allow-empty', '-m', `weave: inputs for ${session.id}`);

  appendEvent(run, { type: 'session:start', stage: `session:${session.id}`, backend: backend.name, model: backend.model });
  // Tests pass their own executable; otherwise Muse Code runs in the agent container unless MUSE_DOCKER is false.
  const inContainer = !deps.bin && ctx.config.MUSE_DOCKER === true;
  const command = deps.bin ?? (inContainer
    ? ['docker', ...dockerArgs(await ensureAgentImage(), appDir, museDir(ctx.config.MUSE_BIN))]
    : [ctx.config.MUSE_BIN]);
  const [bin = 'muse', ...pre] = command;
  const args = museArgs(backend, { promptFile, maxSteps: session.maxSteps ?? 60, effort: 'medium', inContainer });
  // The hook logs every tool call; this session's lines are the ones after this offset.
  const toolsFrom = existsSync(at(TOOLS_LOG)) ? statSync(at(TOOLS_LOG)).size : 0;
  const exec = await execa(bin, [...pre, ...args], {
    cwd: appDir,
    input: backend.apiKey,
    timeout: session.timeoutMs ?? 30 * 60_000,
    reject: false,
  });
  mkdirSync(runPath(run, 'sessions'), { recursive: true });
  writeFileSync(runPath(run, 'sessions', `${slug}.jsonl`), exec.stdout);
  const tools = existsSync(at(TOOLS_LOG)) ? readFileSync(at(TOOLS_LOG)).subarray(toolsFrom).toString('utf8') : '';
  writeFileSync(runPath(run, 'sessions', `${slug}.tools.jsonl`), tools);
  const { deny = [], allow = [] } = session.reads ?? {};
  const readsOutside = readPaths(tools, appDir).filter(
    (file) => deny.some((rule) => inPath(file, rule)) && !allow.some((rule) => inPath(file, rule)),
  );
  const usage = readUsage(exec.stdout);
  const cost = costUsd(usage.model || backend.model, { input: usage.input, cachedInput: usage.cached, output: usage.output });
  appendEvent(run, {
    type: 'llm:call',
    stage: `session:${session.id}`,
    backend: backend.name,
    model: usage.model || backend.model,
    calls: usage.calls,
    input: usage.input,
    cachedInput: usage.cached,
    output: usage.output,
    costUsd: cost,
  });

  git(appDir, 'add', '-A');
  const changes = git(appDir, 'diff', '--cached', '--name-status', 'HEAD')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status = '', ...rest] = line.split('\t');
      return { status: status[0] ?? 'M', path: rest.at(-1) ?? '' };
    })
    .filter((change) => !OURS.has(change.path));
  const changed = changes.map((change) => change.path);
  const protectedHits = protectedOf(changed, session);

  const runCheck = deps.runCheck ?? appCheck;
  const sources = changes.filter((c) => c.status !== 'D' && /\.tsx?$/.test(c.path)).map((c) => c.path);
  const checks: Check[] = [];
  if (sources.length) checks.push(await runCheck(appDir, 'validate', ['node', 'tools/validate-files.mjs', ...sources]));
  checks.push(await runCheck(appDir, 'typecheck', ['pnpm', 'typecheck']));
  checks.push(await runCheck(appDir, 'lint', ['pnpm', 'nx', 'lint', 'web']));
  if (session.route) checks.push(await runCheck(appDir, 'verify', ['pnpm', 'verify', session.route]));
  if (session.expect) checks.push(checkScreen(appDir, session.expect));

  const status: SessionResult['status'] = exec.timedOut
    ? 'timeout'
    : protectedHits.length
      ? 'protected'
      : checks.some((check) => !check.ok)
        ? 'checks'
        : usage.completed
          ? 'done'
          : 'failed';

  appendLedger(appDir, changes.map((change) => ({ ...change, origin: 'model', session: session.id })));
  if (status === 'done') {
    git(appDir, 'add', '-A');
    git(appDir, 'commit', '-q', '--allow-empty', '-m', `weave: ${session.id}`);
  }

  const result: SessionResult = {
    status,
    summary: usage.summary,
    changed,
    protectedHits,
    readsOutside,
    usage: { calls: usage.calls, input: usage.input, cached: usage.cached, output: usage.output, reasoning: usage.reasoning },
    costUsd: cost,
    checks,
  };
  appendEvent(run, {
    type: 'session:end',
    stage: `session:${session.id}`,
    status,
    changed: changed.length,
    protectedHits,
    failedChecks: checks.filter((check) => !check.ok).map((check) => check.name),
    costUsd: cost,
  });
  return result;
}
