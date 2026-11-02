import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import { resolveBackend } from '../core/backends';
import { costUsd } from '../core/prices';
import { appendEvent, runPath } from '../core/run';
import type { StageContext } from '../agents/stages';
import { checkScreen, type ScreenExpect } from './conformance';
import { dockerArgs, ensureAgentImage, museDir } from './docker';
import { appendLedger } from './ledger';
import { savePatch } from './patches';
import { freeAppPort } from './server';
import { museArgs, readUsage } from './muse';
import { git } from './setup';

// One coding session on Muse Code headless. The agent can read
// anything in the app; this code judges the result: it reruns the checks,
// records the diff in the ledger, measures the reads its rules rule out, and
// fails a session whose diff touches a test or a path outside its own.

export type Session = {
  /** 'frames', 'pages', 'repair:R03' */
  id: string;
  /** The short prompt: it names the `.weave/` input files and the guidelines. */
  task: string;
  /** The routes `pnpm verify` checks. */
  routes?: CheckedRoute[];
  /** What each screen's route folder must name, from its design and the contract. */
  expects?: ScreenExpect[];
  /** The only paths the diff may touch, when given: each code stage writes its own folders. */
  writes?: string[];
  /** Paths the guidelines keep the agent from reading; a read there is a warning, since reading can't be blocked. */
  reads?: ReadRules;
  /** The run's stage the session belongs to: its commits' subjects start with it, and its patches go in its folder. */
  stage?: string;
  /** The Muse Code session it runs in: a unit's sessions share one, so its fix rounds keep what its first read and built. */
  museSession?: string;
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

/** The browser storage of a signed-in member, which `pnpm verify --storage` writes before a signed-in page loads. */
export const SIGNED_IN_FILE = '.weave/02-contract/signed-in.json';

/** A route `pnpm verify` checks; one behind sign-in is checked signed in as a member. */
export type CheckedRoute = { url: string; signedIn: boolean };

/**
 * `pnpm verify` on routes as the generated apps need it: at the desktop width only, since the apps have no phone
 * layout, and signed in as a member on routes behind sign-in.
 */
export function verifyCommand(routes: string[], signedIn = false): string[] {
  return ['pnpm', 'verify', ...routes, '--widths', '1280', ...(signedIn ? ['--storage', SIGNED_IN_FILE] : [])];
}
const OURS = new Set(['.weave/hook.log', '.weave/ledger.json', '.weave/tools.log']);
const TOOLS_LOG = '.weave/tools.log';

/**
 * A path rule: `folder/**` covers everything under the folder, `folder/` the
 * files directly in it and none of its subfolders, anything else one file.
 * Write rules are folders, so a file's `.css.ts` beside it is always allowed.
 * Literal, not a glob: route folders such as `[clientId]` and `(routes)` are
 * names, not patterns.
 */
export function inPath(file: string, rule: string): boolean {
  if (rule.endsWith('/**')) return file === rule.slice(0, -3) || file.startsWith(rule.slice(0, -2));
  if (rule.endsWith('/')) return file.startsWith(rule) && !file.slice(rule.length).includes('/');
  return file === rule;
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

/** What pnpm wrote when it installed the app; it changes when anything reinstalls the packages. */
function installState(appDir: string): string {
  const file = path.join(appDir, 'node_modules', '.modules.yaml');
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}

/** The changed files a session may not touch: tests, `PROTECTED`, and anything outside its write paths. */
export function protectedOf(changed: string[], session: Pick<Session, 'writes'>): string[] {
  const outside = (file: string) => session.writes !== undefined && !session.writes.some((rule) => inPath(file, rule));
  return changed.filter(
    (file) => TESTS.test(file) || PROTECTED.some((rule) => inPath(file, rule)) || outside(file),
  );
}

export async function appCheck(appDir: string, name: string, args: string[]): Promise<Check> {
  const [cmd = 'pnpm', ...rest] = args;
  if (rest[0] === 'verify') await freeAppPort(appDir);
  const result = await execa(cmd, rest, { cwd: appDir, reject: false, all: true });
  // pnpm warns that the host's Node is older than a package wants; the line says nothing about the app and crowds out what does.
  const lines = String(result.all ?? '').split('\n').filter((line) => !/WARN\s+Unsupported engine/.test(line));
  return { name, ok: result.exitCode === 0, output: lines.slice(-MAX_OUTPUT_LINES).join('\n') };
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
  const stage = session.stage ?? 'session';
  const at = (...parts: string[]) => path.join(appDir, ...parts);

  const promptFile = `.weave/tasks/${slug}.md`;
  mkdirSync(at('.weave', 'tasks'), { recursive: true });
  writeFileSync(at(promptFile), `${session.task}\n`);
  git(appDir, 'add', '-A');
  git(appDir, 'commit', '-q', '--allow-empty', '-m', `${stage}: inputs for ${session.id}`);

  appendEvent(run, { type: 'session:start', stage: `session:${session.id}`, backend: backend.name, model: backend.model });
  // Tests pass their own executable; otherwise Muse Code runs in the agent container unless MUSE_DOCKER is false.
  const inContainer = !deps.bin && ctx.config.MUSE_DOCKER === true;
  // The subscription is a Muse Code login on the Meta API; the open-weight backends have only keys.
  const subscription = ctx.config.MUSE_AUTH === 'subscription' && backend.name === 'meta';
  const login = subscription ? path.join(os.homedir(), '.config', 'muse') : undefined;
  const command = deps.bin ?? (inContainer
    ? ['docker', ...dockerArgs(await ensureAgentImage(), appDir, museDir(ctx.config.MUSE_BIN), { login, data: runPath(run, 'muse') })]
    : [ctx.config.MUSE_BIN]);
  const [bin = 'muse', ...pre] = command;
  mkdirSync(runPath(run, 'muse'), { recursive: true });
  const args = museArgs(backend, {
    promptFile,
    maxSteps: session.maxSteps ?? 60,
    effort: 'medium',
    inContainer,
    subscription,
    sessionId: session.museSession,
  });
  // The packages are the scaffold's; a session that changes them breaks every check after it.
  const installedBefore = installState(appDir);
  // The hook logs every tool call; this session's lines are the ones after this offset.
  const toolsFrom = existsSync(at(TOOLS_LOG)) ? statSync(at(TOOLS_LOG)).size : 0;
  const exec = await execa(bin, [...pre, ...args], {
    cwd: appDir,
    input: subscription ? '' : backend.apiKey,
    timeout: session.timeoutMs ?? 30 * 60_000,
    reject: false,
  });
  mkdirSync(runPath(run, 'sessions'), { recursive: true });
  writeFileSync(runPath(run, 'sessions', `${slug}.jsonl`), exec.stdout);
  // A log shorter than before was rewritten under the session: all of it is the session's.
  const wholeLog = existsSync(at(TOOLS_LOG)) ? readFileSync(at(TOOLS_LOG)) : Buffer.alloc(0);
  const tools = wholeLog.subarray(wholeLog.length < toolsFrom ? 0 : toolsFrom).toString('utf8');
  writeFileSync(runPath(run, 'sessions', `${slug}.tools.jsonl`), tools);
  const { deny = [], allow = [] } = session.reads ?? {};
  // A folder listed on the way to an allowed file is no read of what the rules keep the agent from.
  const toward = (folder: string, rule: string) => rule.startsWith(`${folder.replace(/\/$/, '')}/`);
  const readsOutside = readPaths(tools, appDir).filter(
    (file) => deny.some((rule) => inPath(file, rule)) && !allow.some((rule) => inPath(file, rule) || toward(file, rule)),
  );
  const usage = readUsage(exec.stdout);
  if (!usage.childrenIncluded && usage.children > 0)
    appendEvent(run, {
      type: 'warning',
      stage: session.stage ?? `session:${session.id}`,
      message: `Muse left ${usage.children} side agents out of this session's usage, so its cost is short by their share; the bill shows it.`,
    });
  // The subscription's allowance pays for these tokens, so they add nothing to the run's spend.
  const cost = subscription ? 0 : costUsd(usage.model || backend.model, { input: usage.input, cachedInput: usage.cached, output: usage.output });
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
    ...(subscription ? { billing: 'subscription', allowance: usage.allowance } : {}),
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
  // Restored first, so the checks below judge the code and not a broken install.
  if (installState(appDir) !== installedBefore) {
    checks.push({ name: 'install', ok: false, output: 'The session changed node_modules. Never install, add or remove a package; the runner reinstalled them from the lockfile.' });
    await runCheck(appDir, 'restore', ['env', 'CI=true', 'pnpm', 'install', '--frozen-lockfile', '--prefer-offline']);
  }
  if (sources.length) checks.push(await runCheck(appDir, 'validate', ['node', 'tools/validate-files.mjs', ...sources]));
  checks.push(await runCheck(appDir, 'typecheck', ['pnpm', 'typecheck']));
  checks.push(await runCheck(appDir, 'lint', ['pnpm', 'nx', 'lint', 'web']));
  // One verify for the visitor's routes and one for the member's: each call sets its storage for every route it opens.
  for (const signedIn of [false, true]) {
    const urls = (session.routes ?? []).filter((route) => route.signedIn === signedIn).map((route) => route.url);
    if (urls.length) checks.push(await runCheck(appDir, 'verify', verifyCommand(urls, signedIn)));
  }
  for (const expect of session.expects ?? []) checks.push(checkScreen(appDir, expect));

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
  // Committed whatever its status, so the next session starts from a clean tree and each commit is one session's work.
  const failed = checks.filter((check) => !check.ok).map((check) => check.name);
  const outcome = status === 'done' ? '' : status === 'checks' ? ` (failed: ${failed.join(', ')})` : ` (${status})`;
  git(appDir, 'add', '-A');
  git(appDir, 'commit', '-q', '--allow-empty', '-m', `${stage}: ${session.id}${outcome}`);
  savePatch(run, appDir, stage);

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
    failedChecks: failed,
    costUsd: cost,
  });
  return result;
}
