import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readArtifact } from '../../../core/artifacts';
import type { Issue } from '../../../core/issues';
import { loadPrompt } from '../../../core/prompt';
import { runPath } from '../../../core/run';
import { pathBeside } from '../../../core/utils';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Themed } from '../../02design/01theme/build';
import type { Architecture } from '../../02design/02architect/schema';
import type { StageContext, StageDef } from '../../stages';
import { frameGroup } from '../01scaffold/weave';
import { signedIn, storagePrefix } from '../02contract/codegen';
import { behindSignIn, renderedOn, routeSample } from '../rendered';
import { runUnits, type UnitSpec } from '../unit';

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
  return architecture.frames.flatMap((frame) => {
    const screen = architecture.screens.find((s) => s.frame === frame.id);
    if (!screen) return [];
    const group = frameGroup(architecture, frame.id);
    const route = `/weave-frame-${group}`;
    return [{ frame: frame.id, file: `web/app/(routes)/(${group})${route}/page.tsx`, route, signedIn: behindSignIn(screen, flows, scope) }];
  });
}

/** `check` with the probes in place; they are gone again before the session's diff is read, even when the check throws. */
export function withProbes(appDir: string, probes: Probe[], check: () => Promise<Issue[]>): () => Promise<Issue[]> {
  return async () => {
    // A folder the app already has is never written to, so removing ours can touch nothing of the app's.
    const files = probes.map((probe) => path.join(appDir, probe.file)).filter((file) => !existsSync(path.dirname(file)));
    for (const file of files) {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, PROBE_PAGE);
    }
    try {
      return await check();
    } finally {
      for (const file of files) rmSync(path.dirname(file), { recursive: true, force: true });
    }
  };
}

async function runFrames(ctx: StageContext): Promise<void> {
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
  await runUnits(ctx, STAGE, framesSpecs(architecture).map((spec) => ({ ...spec, ...(rendered && { rendered }) })));
}

export const framesStage: StageDef = { name: STAGE, produces: [], run: (ctx) => runFrames(ctx) };
