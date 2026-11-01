import { readArtifact } from '../../../core/artifacts';
import { appendEvent, updateStage } from '../../../core/run';
import { pathBeside } from '../../../core/utils';
import { loadPrompt } from '../../../core/prompt';
import type { SessionDeps } from '../../../engine/session';
import type { WidgetScreens } from '../../02design/08assemble/assemble';
import type { StageContext, StageDef } from '../../stages';
import { sharedUnits } from '../01scaffold/weave';
import { ENTITIES, runUnits, type UnitSpec } from '../unit';

const STAGE = 'code-shared';

/** One session for every new component, then every widget, form and dialog two or more screens use; none when nothing is shared. */
export function sharedSpecs(design: WidgetScreens): UnitSpec[] {
  const shared = sharedUnits(design);
  if (!design.newComponents.length && !shared.widgets.size && !shared.dialogs.size) return [];
  return [
    {
      id: 'shared',
      stage: STAGE,
      task: loadPrompt(pathBeside(import.meta.url, './prompts/task.md')),
      folders: ['01-scaffold', '02-contract', '03-shared'],
      writes: ['web/app/components/**', 'web/app/blocks/**', ENTITIES],
      // A shared dialog is one screen, so its node ids are the same wherever it opens; a shared widget's come from each page.
      expect: {
        folder: 'web/app/blocks',
        testIds: design.sections
          .filter((s) => shared.dialogs.has(s.screen))
          .flatMap((s) => design.nodes.filter((n) => n.section === s.id).map((n) => n.id)),
        operations: [],
      },
    },
  ];
}

export async function runShared(ctx: StageContext, deps: SessionDeps = {}): Promise<void> {
  const specs = sharedSpecs(readArtifact<WidgetScreens>(ctx.run, 'design-assemble').data);
  if (specs.length) return runUnits(ctx, STAGE, specs, deps);
  updateStage(ctx.run, STAGE, { status: 'done', known: 0 });
  appendEvent(ctx.run, { type: 'stage:done', stage: STAGE, skipped: 'nothing shared' });
}

export const sharedStage: StageDef = { name: STAGE, produces: [], run: (ctx) => runShared(ctx) };
