import pLimit from 'p-limit';
import { readArtifact, writeArtifact } from '../../../core/artifacts';
import { appendEvent, updateStage } from '../../../core/run';
import { type Inventory, inventory } from '../../../ds/inventory';
import type { StageContext, StageDef } from '../../stages';
import type { Processed as Plan } from '../03architect/process';
import type { Processed as Catalog } from '../04catalog/process';
import { caller, designInputs, PARALLEL } from '../calls';
import { screenReviewGuides, screenSystemPrompt, screenUserMessage } from './prompts/index';
import { SCREEN_KEYS, ScreenLayouts } from './schema';
import { validateLayouts } from './validation/validation';
import { contentWidth, gapOf } from './width';

// A screen call per page with the dialogs and drawers it opens, at medium
// reasoning and 0.2, three at a time (DS23).
const SCREEN_MAX_TOKENS = 16_384;
const SCREEN_EFFORT = 'medium';

/** `02-design/05-screen.json`: each call's screens, its layouts and the model that wrote them. */
export type Laid = {
  calls: { key: string; ids: string[]; output: ScreenLayouts; model: string }[];
};

/** A page with the dialogs and drawers it opens, keyed by the page's id. */
export function groupsOf(plan: Plan): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const page of plan.screens.filter((s) => s.type === 'page'))
    groups.set(page.id, [
      page.id,
      ...plan.screens.filter((s) => s.type !== 'page' && s.parent === page.id).map((s) => s.id),
    ]);
  return groups;
}

export async function runScreen(ctx: StageContext, inv: Inventory): Promise<void> {
  const { run } = ctx;
  appendEvent(run, { type: 'stage:start', stage: 'design-screen' });
  updateStage(run, 'design-screen', { status: 'running' });
  const plan = readArtifact<Plan>(run, 'design-architect').data;
  const catalog = readArtifact<Catalog>(run, 'design-catalog').data;
  const { brief, theme, context } = designInputs(run, inv);
  const measure = (id: string) => {
    const screen = plan.screens.find((s) => s.id === id);
    return screen
      ? { width: contentWidth(screen, theme, inv), gapPx: gapOf(screen, theme, inv) }
      : { width: 0, gapPx: 0 };
  };
  const { call, totals } = caller(ctx);
  const limit = pLimit(PARALLEL);
  const calls = await Promise.all(
    [...groupsOf(plan)].map(([key, ids]) =>
      limit(async () => {
        const screens = plan.screens.filter((s) => ids.includes(s.id));
        const { output, model } = await call({
          stage: `design-screen-${key}`,
          schema: ScreenLayouts,
          schemaName: 'ScreenLayouts',
          system: screenSystemPrompt(brief),
          user: screenUserMessage(screens, catalog, plan.newComponents, measure),
          validate: (out) => validateLayouts(out, ids, plan, catalog, context, measure),
          review: screenReviewGuides(),
          maxTokens: SCREEN_MAX_TOKENS,
          reasoningEffort: SCREEN_EFFORT,
          patchKeys: SCREEN_KEYS,
        });
        return { key, ids, output, model };
      }),
    ),
  );
  const { rounds, known } = totals();
  writeArtifact(run, 'design-screen', { calls } satisfies Laid, {
    stage: 'design-screen',
    model: calls[0]?.model ?? null,
    rounds,
    inputs: ['design-architect', 'design-catalog', 'design-brief', 'design-theme'],
  });
  updateStage(run, 'design-screen', { rounds, known });
  appendEvent(run, { type: 'stage:done', stage: 'design-screen', rounds, known });
}

export const screenStage: StageDef = {
  name: 'design-screen',
  produces: ['design-screen'],
  run: async (ctx) => runScreen(ctx, await inventory()),
};
