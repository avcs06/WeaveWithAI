import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Inventory } from '../../../../ds/inventory';
import { inventoryProse } from '../../../../ds/prose';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import type { Brief } from '../../01brief/schema';
import type { Theme } from '../../02theme/build';
import type { WidgetIa } from '../../03architect/schema';
import { HEADING_SIZES } from '../../09assemble/nodes';
import { SIDE_WIDTH_PX } from '../../config';
import { type Kind, look, placed, screenList } from '../../prompts';
import { placementsOf, stepFields } from '../../rules/helpers';
import type { NewComponent } from '../../schema';

/** The node guide the widget and frame prompts share, with each level's heading size. */
export function nodeGuide(brief: Brief): string {
  const sizes = (kind: Kind) =>
    HEADING_SIZES[kind].map((size, i) => `H${i + 1} ${size}`).join(', ');
  return fillPrompt(load('./nodes.md'), {
    voice: brief.voice,
    density: brief.density,
    headingSizes: `on app screens ${sizes('app')}, on marketing pages ${sizes('marketing')}`,
  });
}

/** A widget call's system prompt for the widgets it builds. */
export function widgetsSystemPrompt(
  ids: string[],
  brief: Brief,
  inv: Inventory,
): string {
  return fillPrompt(load('./prompt.md'), {
    widgetIds: ids.join(' and '),
    sideWidth: String(SIDE_WIDTH_PX),
    nodeGuide: nodeGuide(brief),
    dsProse: inventoryProse(inv),
  });
}

/**
 * A widget call's user message: the widgets with their placements, the copy
 * deck, the screens, the steps they serve with their fields, the designed
 * components they use, the vocabulary and the look.
 */
export function widgetsUserMessage(
  ids: string[],
  ia: WidgetIa,
  components: NewComponent[],
  flows: Flows,
  scope: Scope,
  brief: Brief,
  theme: Theme,
): string {
  const widgets = ia.widgets.filter((w) => ids.includes(w.id));
  const served = new Set(widgets.flatMap((w) => w.flowSteps));
  const all = [...flows.flows, ...flows.subflows];
  const steps = all.flatMap((flow) =>
    flow.steps.filter((step) => served.has(step.id)),
  );
  const fields = new Set(steps.flatMap((step) => stepFields(flows, step)));
  const kinds = new Set<Kind>(
    widgets.flatMap((w) =>
      placementsOf(ia, w.id).map(
        (p) => ia.screens.find((s) => s.id === p.screen)?.kind ?? 'app',
      ),
    ),
  );
  const uses = new Set(widgets.flatMap((w) => w.newComponents));
  return fillPrompt(load('./input.md'), {
    widgets: json(widgets.map((w) => ({ ...w, placements: placed(ia, w.id) }))),
    deck: json(ia.copy),
    screens: json(screenList(ia)),
    steps: json({
      steps,
      alternatives: all.flatMap((flow) =>
        flow.alternatives.filter((alt) => served.has(alt.id)),
      ),
      fields: flows.fields.filter((field) => fields.has(field.id)),
    }),
    components: json(components.filter((c) => uses.has(c.name))),
    vocabulary: json(scope.vocabulary),
    look: json(look(brief, theme, [...kinds])),
  });
}

/** The output reviewer alone for the calls that build on the IA (DS22): its decisions are already reviewed. */
export const widgetReviewGuides = (): ReviewGuides => ({
  output: guide('review-output'),
});

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** A review guide beside this file: `review-peer` or `review-output`. */
const guide = (name: string) => fillPrompt(load(`./${name}.md`), {});
