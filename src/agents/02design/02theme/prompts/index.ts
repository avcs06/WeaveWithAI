import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Inventory } from '../../../../ds/inventory';
import { inventoryProse } from '../../../../ds/prose';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import type { Brief } from '../../01brief/schema';
import { entitySets, modesOf } from '../schema';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The theme call's system prompt: the brief's modes and colored entities, and the design system as prose. */
export function themeSystemPrompt(brief: Brief, inv: Inventory): string {
  const sets = entitySets(brief);
  return fillPrompt(load('./prompt.md'), {
    modes:
      modesOf(brief).length === 2
        ? 'light and dark'
        : `${brief.colorScheme} only`,
    entitySets: sets.length
      ? sets.map(({ name, hue }) => `${name} (hue ${hue})`).join(', ')
      : 'none, so `entity` stays empty',
    dsProse: inventoryProse(inv),
  });
}

/** The theme call's user message: the brief, the scope and what each flow is; the frame needs no steps. */
export function themeUserMessage(
  brief: Brief,
  scope: Scope,
  flows: Flows,
): string {
  return fillPrompt(load('./input.md'), {
    brief: json(brief),
    scope: json(scope),
    flows: json(
      flows.flows.map(({ id, name, role, category, authKind, goal }) => ({
        id,
        name,
        role,
        category,
        authKind,
        goal,
      })),
    ),
  });
}

/** A review guide beside this file: `review-peer` or `review-output`. */
const guide = (name: string) => fillPrompt(load(`./${name}.md`), {});

/** The call's two review guides (D1.12): the product designer peer, then the output reviewer. */
export const themeReviewGuides = (): ReviewGuides => ({
  peer: guide('review-peer'),
  output: guide('review-output'),
});
