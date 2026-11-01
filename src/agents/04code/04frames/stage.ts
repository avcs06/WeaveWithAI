import { readArtifact } from '../../../core/artifacts';
import { runPath } from '../../../core/run';
import { loadPrompt } from '../../../core/prompt';
import { pathBeside } from '../../../core/utils';
import { nodeWords } from '../../../engine/conformance';
import type { Themed } from '../../02design/01theme/build';
import type { WidgetScreens } from '../../02design/08assemble/assemble';
import type { StageContext, StageDef } from '../../stages';
import { renderedOn, routeSample } from '../rendered';
import { ENTITIES, runUnits, type UnitSpec } from '../unit';

const STAGE = 'code-frames';

/** One session for every shell: its layout in a route group named after it, and its parts in components. */
export function framesSpecs(design: WidgetScreens): Omit<UnitSpec, 'rendered'>[] {
  if (!design.shells.length) return [];
  const shellNodes = design.nodes.filter((n) => /^SH\d+\./.test(n.id));
  return [
    {
      id: 'frames',
      stage: STAGE,
      task: loadPrompt(pathBeside(import.meta.url, './prompts/task.md')),
      folders: ['01-scaffold', '02-contract', '03-shared', '04-frames'],
      // The shell folders' own files, a layout's styles included; the route folders inside are the pages'.
      writes: [...design.shells.map((s) => `web/app/(routes)/(${s.name})/`), 'web/app/components/**', ENTITIES],
      // No page sits in a shell yet, so the browser checks run on the starter route; the pages check the frames in place.
      route: '/',
      expect: {
        folder: 'web/app',
        testIds: shellNodes.map((n) => n.id),
        words: nodeWords(shellNodes),
        operations: [],
      },
    },
  ];
}

async function runFrames(ctx: StageContext): Promise<void> {
  const design = readArtifact<WidgetScreens>(ctx.run, 'design-assemble').data;
  const { theme } = readArtifact<Themed>(ctx.run, 'design-theme').data;
  const appDir = runPath(ctx.run, 'app');
  const rendered = renderedOn(ctx.run, appDir, [routeSample('/', 'frames', false)], theme);
  await runUnits(ctx, STAGE, framesSpecs(design).map((spec) => ({ ...spec, rendered })));
}

export const framesStage: StageDef = { name: STAGE, produces: [], run: (ctx) => runFrames(ctx) };
