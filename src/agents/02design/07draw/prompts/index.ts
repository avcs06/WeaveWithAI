import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Inventory } from '../../../../ds/inventory';
import { inventoryProse } from '../../../../ds/prose';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import type { Brief } from '../../01brief/schema';
import type { Theme } from '../../02theme/build';
import type { Processed as Plan } from '../../03architect/process';
import type { Defined, Processed as Catalog } from '../../04catalog/process';
import { HEADING_SIZES } from '../../09assemble/nodes';
import { type Kind, look, screenList } from '../../prompts';
import { stepFields } from '../../rules/helpers';

/** The node guide the draw, invent and frame prompts share, with each level's heading size. */
export function nodeGuide(brief: Brief): string {
  const sizes = (kind: Kind) =>
    HEADING_SIZES[kind].map((size, i) => `H${i + 1} ${size}`).join(', ');
  return fillPrompt(load('./nodes.md'), {
    voice: brief.voice,
    density: brief.density,
    headingSizes: `on app screens ${sizes('app')}, on marketing pages ${sizes('marketing')}`,
  });
}

/** A draw call's system prompt, the same for every call so its prefix is cached. */
export function widgetsSystemPrompt(brief: Brief, inv: Inventory): string {
  return fillPrompt(load('./prompt.md'), {
    nodeGuide: nodeGuide(brief),
    dsProse: inventoryProse(inv),
  });
}

/**
 * A draw call's user message: the widget it draws with its definition, the
 * steps it serves with their fields, the new components it holds, the
 * screens, the vocabulary and the look.
 */
export function widgetsUserMessage(
  widget: Defined,
  plan: Plan,
  catalog: Catalog,
  flows: Flows,
  scope: Scope,
  brief: Brief,
  theme: Theme,
): string {
  const served = new Set(widget.flowSteps);
  const all = [...flows.flows, ...flows.subflows];
  const steps = all.flatMap((flow) =>
    flow.steps.filter((step) => served.has(step.id)),
  );
  const fields = new Set(steps.flatMap((step) => stepFields(flows, step)));
  const kinds = new Set<Kind>(
    catalog.screens
      .filter((s) => s.parts.includes(widget.id))
      .map((s) => plan.screens.find((x) => x.id === s.screen)?.kind ?? 'app'),
  );
  const holds = new Set(widget.newComponents);
  return fillPrompt(load('./input.md'), {
    widget: json(widget),
    steps: json({
      steps,
      alternatives: all.flatMap((flow) =>
        flow.alternatives.filter((alt) => served.has(alt.id)),
      ),
      fields: flows.fields.filter((field) => fields.has(field.id)),
    }),
    components: json(
      plan.newComponents
        .filter((c) => holds.has(c.name))
        .map((c) => ({ ...c, ...catalog.components.find((x) => x.name === c.name) })),
    ),
    screens: json(screenList(plan)),
    vocabulary: json(scope.vocabulary),
    look: json(look(brief, theme, [...kinds])),
  });
}

/** The output reviewer alone (DS22): the decisions were the architect's, already reviewed. */
export const widgetReviewGuides = (): ReviewGuides => ({
  output: guide('review-output'),
});

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** A review guide beside this file: `review-peer` or `review-output`. */
const guide = (name: string) => fillPrompt(load(`./${name}.md`), {});
