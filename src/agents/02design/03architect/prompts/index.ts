import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Inventory } from '../../../../ds/inventory';
import { inventoryProse } from '../../../../ds/prose';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import type { Brief } from '../../01brief/schema';
import type { Layouts } from '../../02theme/schema';
import { NEW_COMPONENT_BUDGET } from '../../config';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The architect's system prompt: the density, the design system and the budget. */
export function planSystemPrompt(brief: Brief, inv: Inventory): string {
  return fillPrompt(load('./prompt.md'), {
    density: brief.density,
    newComponentBudget: String(NEW_COMPONENT_BUDGET),
    dsProse: inventoryProse(inv),
  });
}

/** The architect's user message: the scope, the flows, the brief and the theme's two page layouts. */
export function planUserMessage(
  scope: Scope,
  flows: Flows,
  brief: Brief,
  layouts: Layouts,
): string {
  return fillPrompt(load('./input.md'), {
    scope: json(scope),
    flows: json(flows),
    brief: json(brief),
    layouts: json(layouts),
  });
}

/** A review guide beside this file: `review-peer` or `review-output`. */
const guide = (name: string) => fillPrompt(load(`./${name}.md`), {});

/** The architect's two review guides (D1.12): the product designer peer, then the output reviewer. */
export const planReviewGuides = (): ReviewGuides => ({
  peer: guide('review-peer'),
  output: guide('review-output'),
});
