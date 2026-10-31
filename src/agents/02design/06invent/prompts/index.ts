import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Inventory } from '../../../../ds/inventory';
import { inventoryProse } from '../../../../ds/prose';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Brief } from '../../01brief/schema';
import type { Theme } from '../../02theme/build';
import type { Processed as Plan } from '../../03architect/process';
import type { Processed as Catalog } from '../../04catalog/process';
import { nodeGuide } from '../../07draw/prompts/index';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** An invent call's system prompt, the same for every component so its prefix is cached. */
export function componentSystemPrompt(brief: Brief, inv: Inventory): string {
  return fillPrompt(load('./prompt.md'), {
    nodeGuide: nodeGuide(brief),
    dsProse: inventoryProse(inv),
  });
}

/** An invent call's user message: the declaration and description with its width range, where it is used, the vocabulary and the look. */
export function componentUserMessage(
  name: string,
  plan: Plan,
  catalog: Catalog,
  scope: Scope,
  brief: Brief,
  theme: Theme,
): string {
  return fillPrompt(load('./input.md'), {
    component: json({
      ...plan.newComponents.find((c) => c.name === name),
      ...catalog.components.find((c) => c.name === name),
    }),
    widgets: json({
      holding: catalog.widgets
        .filter((w) => w.newComponents.includes(name))
        .map(({ id, name: widget, holds }) => ({ id, name: widget, holds })),
      placedOn: catalog.screens.filter((s) => s.parts.includes(name)).map((s) => s.screen),
    }),
    vocabulary: json(scope.vocabulary),
    look: json({
      feel: brief.feel,
      personality: brief.personality,
      density: brief.density,
      radius: brief.radius,
      imagery: brief.imagery,
      defaults: theme.defaults,
    }),
  });
}

/** An invent call's two review guides (D1.12): the peer judges the drawing against the description, then the output reviewer. */
export const componentReviewGuides = (): ReviewGuides => ({
  peer: fillPrompt(load('./review-peer.md'), {}),
  output: fillPrompt(load('./review-output.md'), {}),
});
