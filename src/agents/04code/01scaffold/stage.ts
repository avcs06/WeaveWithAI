import { readFileSync } from 'node:fs';
import path from 'node:path';
import { readArtifact } from '../../../core/artifacts';
import { appendEvent, runPath, updateStage } from '../../../core/run';
import { ensureAgentImage } from '../../../engine/docker';
import { appendLedger } from '../../../engine/ledger';
import { saveStagePatch } from '../../../engine/patches';
import { appCheck, type Check } from '../../../engine/session';
import { prepareApp } from '../../../engine/setup';
import type { Themed } from '../../02design/01theme/build';
import type { StageContext, StageDef } from '../../stages';
import { applyMode, ensureApp } from './app';
import { applyTheme } from './apply';
import { readCodeInputs } from './inputs';
import { validateApplied } from './validation/validation';
import { weaveFolders, writeWeave } from './weave';

const STAGE = 'code-scaffold';
const CHECKS: [string, string[]][] = [
  ['typecheck', ['pnpm', 'typecheck']],
  ['mcp:check', ['pnpm', 'mcp:check']],
  ['verify', ['pnpm', 'verify', '/']],
];

/** Tests swap the template copy and the app's checks. */
type ScaffoldDeps = {
  scaffold?: (appDir: string) => Promise<void>;
  check?: (appDir: string, name: string, args: string[]) => Promise<Check>;
};

/** The run's app: the template once, then the theme by code, proven by THEME-003, the sessions' .weave folders, the agent config, and the app's own checks. */
export async function runScaffold(ctx: StageContext, deps: ScaffoldDeps = {}): Promise<void> {
  const { run } = ctx;
  appendEvent(run, { type: 'stage:start', stage: STAGE });
  updateStage(run, STAGE, { status: 'running' });
  const fail = (error: string): never => {
    updateStage(run, STAGE, { status: 'failed' });
    appendEvent(run, { type: 'stage:failed', stage: STAGE, error });
    throw new Error(`${STAGE}: ${error}`);
  };

  const { theme } = readArtifact<Themed>(run, 'design-theme').data;
  const appDir = runPath(run, 'app');
  const { movedAside } = await ensureApp(appDir, deps.scaffold);
  if (movedAside) appendEvent(run, { type: 'scaffold:moved-aside', stage: STAGE, to: movedAside });
  const { changed, skipped } = applyTheme(appDir, theme);
  if (applyMode(appDir, theme)) changed.push('packages/ui/src/Root/UIRoot.tsx');
  for (const reason of skipped) appendEvent(run, { type: 'scaffold:skipped', stage: STAGE, reason });

  // A wrong color here is a generator bug, never the model's.
  const issues = validateApplied({ colorsTs: readFileSync(path.join(appDir, 'colors.ts'), 'utf8'), theme });
  if (issues.length) fail(issues.map((issue) => issue.message).join('\n'));

  appendLedger(appDir, changed.map((file) => ({ path: file, status: 'M', origin: 'code', stage: STAGE })));
  if (ctx.config.MUSE_DOCKER === true) await ensureAgentImage();
  // Before the baseline commit, so every session's diff starts with its inputs in place.
  writeWeave(appDir, weaveFolders(readCodeInputs(run)));
  prepareApp(appDir, `${STAGE}: theme, .weave inputs and agent config`);
  saveStagePatch(run, appDir, STAGE);

  const check = deps.check ?? appCheck;
  for (const [name, args] of CHECKS) {
    const result = await check(appDir, name, args);
    appendEvent(run, { type: 'check:run', stage: STAGE, name, ok: result.ok });
    if (!result.ok) fail(`${name} failed in the app:\n${result.output}`);
  }
  updateStage(run, STAGE, { status: 'done' });
  appendEvent(run, { type: 'stage:done', stage: STAGE });
}

export const scaffoldStage: StageDef = {
  name: STAGE,
  produces: [],
  run: (ctx) => runScaffold(ctx),
};
