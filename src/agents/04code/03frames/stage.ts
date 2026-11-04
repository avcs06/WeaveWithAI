import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readArtifact } from '../../../core/artifacts';
import { loadPrompt } from '../../../core/prompt';
import { appendEvent, type Run, runPath } from '../../../core/run';
import { pathBeside } from '../../../core/utils';
import type { Rendered } from '../../../engine/compose';
import { appendLedger } from '../../../engine/ledger';
import { appCheck } from '../../../engine/session';
import { git } from '../../../engine/setup';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Themed } from '../../02design/01theme/build';
import type { Architecture } from '../../02design/02architect/schema';
import type { StageContext, StageDef } from '../../stages';
import { routeGroups } from '../01scaffold/weave';
import { signedIn, storagePrefix } from '../02contract/codegen';
import { behindSignIn, renderedOn, routeSample } from '../rendered';
import { runUnits, type UnitSpec } from '../unit';
import { frameSkeletons } from './skeleton';

const STAGE = 'code-frames';

export function framesSpecs(architecture: Architecture): Omit<UnitSpec, 'rendered'>[] {
  if (!architecture.frames.length) return [];
  return [
    {
      id: 'frames',
      stage: STAGE,
      task: loadPrompt(pathBeside(import.meta.url, './prompts/task.md')),
      folders: ['01-scaffold', '02-contract', '03-frames'],
    },
  ];
}

/** A page in a frame's route group, there only while the checks run: a layout shows only around a page, and no screen is built yet. */
export type Probe = { frame: string; file: string; route: string; signedIn: boolean };

// The probe's heading is marked as not the app's, so the checks judge only the frame around it.
const PROBE_PAGE = 'export default function FrameProbe() {\n  return <h1 data-ds="">Frame check</h1>;\n}\n';

/** One probe for each frame a screen uses, signed in when that screen is. */
export function frameProbes(architecture: Architecture, flows: Flows, scope: Scope): Probe[] {
  const groups = routeGroups(architecture, flows, scope);
  return architecture.frames.flatMap((frame) => {
    const screen = architecture.screens.find((s) => s.frame === frame.id);
    const group = groups.get(frame.id);
    if (!screen || !group) return [];
    const route = `/weave-frame-${group}`;
    return [{ frame: frame.id, file: `web/app/(routes)/(${group})${route}/page.tsx`, route, signedIn: behindSignIn(screen, flows, scope) }];
  });
}

/** `check` with the probes in place; they are gone again before the session's diff is read, even when the check throws. */
export function withProbes(appDir: string, probes: Probe[], check: (shotsDir: string) => Promise<Rendered>): (shotsDir: string) => Promise<Rendered> {
  return async (shotsDir) => {
    // A folder the app already has is never written to, so removing ours can touch nothing of the app's.
    const files = probes.map((probe) => path.join(appDir, probe.file)).filter((file) => !existsSync(path.dirname(file)));
    for (const file of files) {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, PROBE_PAGE);
    }
    try {
      return await check(shotsDir);
    } finally {
      for (const file of files) rmSync(path.dirname(file), { recursive: true, force: true });
    }
  };
}

/** The frames' layouts and empty parts, by code, committed before the session so its diff holds only what it fills in. */
async function writeSkeletons(run: Run, appDir: string, files: Map<string, string>): Promise<void> {
  const existed = new Set([...files.keys()].filter((file) => existsSync(path.join(appDir, file))));
  for (const [file, text] of files) {
    mkdirSync(path.dirname(path.join(appDir, file)), { recursive: true });
    writeFileSync(path.join(appDir, file), text);
  }
  appendLedger(
    appDir,
    [...files.keys()].map((file) => ({ path: file, status: existed.has(file) ? 'M' : 'A', origin: 'code', stage: STAGE })),
  );
  const checks: [string, string[]][] = [
    ['validate', ['node', 'tools/validate-files.mjs', ...files.keys()]],
    ['typecheck', ['pnpm', 'typecheck']],
    ['lint', ['pnpm', 'nx', 'lint', 'web']],
  ];
  for (const [name, args] of checks) {
    const result = await appCheck(appDir, name, args);
    appendEvent(run, { type: 'check:run', stage: STAGE, name, ok: result.ok });
    // Code wrote every file here, so a failing check is a generator bug.
    if (!result.ok) throw new Error(`${STAGE}: ${name} failed on the frame layouts:\n${result.output}`);
  }
  git(appDir, 'add', '-A');
  git(appDir, 'commit', '-q', '-m', `${STAGE}: frame layouts by code`);
}

function framesUnits(ctx: StageContext): UnitSpec[] {
  const architecture = readArtifact<Architecture>(ctx.run, 'design-architect').data;
  const flows = readArtifact<Flows>(ctx.run, 'flows-expand').data;
  const scope = readArtifact<Scope>(ctx.run, 'flows-scope').data;
  const { theme } = readArtifact<Themed>(ctx.run, 'design-theme').data;
  const appDir = runPath(ctx.run, 'app');
  const probes = frameProbes(architecture, flows, scope);
  const samples = probes.map((probe) =>
    routeSample(probe.route, probe.frame, false, probe.signedIn ? signedIn(storagePrefix(ctx.run)) : undefined),
  );
  const rendered = samples.length ? withProbes(appDir, probes, renderedOn(ctx.run, appDir, samples, theme)) : undefined;
  return framesSpecs(architecture).map((spec) => ({ ...spec, ...(rendered && { rendered }) }));
}

async function runFrames(ctx: StageContext): Promise<void> {
  const architecture = readArtifact<Architecture>(ctx.run, 'design-architect').data;
  const flows = readArtifact<Flows>(ctx.run, 'flows-expand').data;
  const scope = readArtifact<Scope>(ctx.run, 'flows-scope').data;
  const { theme } = readArtifact<Themed>(ctx.run, 'design-theme').data;
  const skeletons = frameSkeletons(architecture, flows, scope, theme);
  await runUnits(
    ctx,
    STAGE,
    framesUnits(ctx),
    {},
    // Only a frame beyond the app's and the marketing site's needs code here.
    skeletons.size ? (dir) => writeSkeletons(ctx.run, dir, skeletons) : undefined,
  );
}

export const framesStage: StageDef = { name: STAGE, produces: [], units: framesUnits, run: (ctx) => runFrames(ctx) };
