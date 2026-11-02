import { readArtifact } from '../../../core/artifacts';
import { loadPrompt } from '../../../core/prompt';
import { pathBeside } from '../../../core/utils';
import type { Architecture } from '../../02design/02architect/schema';
import type { StageContext, StageDef } from '../../stages';
import { frameGroup } from '../01scaffold/weave';
import { ENTITIES, runUnits, type UnitSpec } from '../unit';

const STAGE = 'code-frames';

/** One session for every frame: its layout in its route group, and its parts in components. */
export function framesSpecs(architecture: Architecture): Omit<UnitSpec, 'rendered'>[] {
  if (!architecture.frames.length) return [];
  return [
    {
      id: 'frames',
      stage: STAGE,
      task: loadPrompt(pathBeside(import.meta.url, './prompts/task.md')),
      folders: ['01-scaffold', '02-contract', '03-frames'],
      // The route groups' own files, a layout's styles included; the route folders inside are the screens'.
      writes: [
        ...architecture.frames.map((frame) => `web/app/(routes)/(${frameGroup(architecture, frame.id)})/`),
        'web/app/components/**',
        ENTITIES,
      ],
    },
  ];
}

async function runFrames(ctx: StageContext): Promise<void> {
  const architecture = readArtifact<Architecture>(ctx.run, 'design-architect').data;
  await runUnits(ctx, STAGE, framesSpecs(architecture));
}

export const framesStage: StageDef = { name: STAGE, produces: [], run: (ctx) => runFrames(ctx) };
