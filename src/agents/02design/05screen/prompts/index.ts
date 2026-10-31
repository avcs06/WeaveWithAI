import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Brief } from '../../01brief/schema';
import type { Planned } from '../../03architect/process';
import type { PlannedComponent } from '../../03architect/schema';
import type { Processed as Catalog } from '../../04catalog/process';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** A screen call's system prompt: the brief's voice for the slot words. */
export function screenSystemPrompt(brief: Brief): string {
  return fillPrompt(load('./prompt.md'), { voice: brief.voice });
}

/** A screen call's user message: its screens, and the widgets and components they are made of. */
export function screenUserMessage(
  screens: Planned[],
  catalog: Catalog,
  components: PlannedComponent[],
  measure: (screen: string) => { width: number; gapPx: number },
): string {
  const parts = new Set(
    catalog.screens.filter((s) => screens.some((x) => x.id === s.screen)).flatMap((s) => s.parts),
  );
  return fillPrompt(load('./input.md'), {
    screens: json(
      screens.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        kind: s.kind,
        title: s.title,
        composition: s.composition,
        parts: catalog.screens.find((x) => x.screen === s.id)?.parts ?? [],
        ...measure(s.id),
      })),
    ),
    parts: json([
      ...catalog.widgets
        .filter((w) => parts.has(w.id))
        .map(({ id, name, kind, holds, minWidthPx, maxWidthPx, containsHeading, slots }) => ({
          id, name, kind, holds, minWidthPx, maxWidthPx, containsHeading, slots,
        })),
      ...components
        .filter((c) => parts.has(c.name))
        .map((c) => ({
          id: c.name,
          holds: c.purpose,
          ...catalog.components.find((x) => x.name === c.name),
          containsHeading: false,
          slots: [],
        })),
    ]),
  });
}

/** A screen call's review guide (D1.12): the output reviewer alone. */
export const screenReviewGuides = (): ReviewGuides => ({
  output: fillPrompt(load('./review-output.md'), {}),
});
