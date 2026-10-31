import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Inventory } from '../../../../ds/inventory';
import { inventoryProse } from '../../../../ds/prose';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Brief } from '../../01brief/schema';
import type { Theme } from '../../02theme/build';
import type { WidgetIa } from '../../03architect/schema';
import { placed } from '../../prompts';

/** A component call's system prompt. */
export function componentSystemPrompt(name: string, inv: Inventory): string {
  return fillPrompt(load('./prompt.md'), {
    componentName: name,
    dsProse: inventoryProse(inv),
  });
}

/** A component call's user message: its declaration, the widgets that use it and where, the vocabulary and the look. */
export function componentUserMessage(
  name: string,
  ia: WidgetIa,
  scope: Scope,
  brief: Brief,
  theme: Theme,
): string {
  const users = ia.widgets.filter((w) => w.newComponents.includes(name));
  return fillPrompt(load('./input.md'), {
    declaration: json(ia.newComponents.find((c) => c.name === name)),
    widgets: json(users.map((w) => ({ ...w, placements: placed(ia, w.id) }))),
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

export const componentReviewGuides = (): ReviewGuides => ({
  output: guide('review-output'),
});

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** A review guide beside this file: `review-peer` or `review-output`. */
const guide = (name: string) => fillPrompt(load(`./${name}.md`), {});
