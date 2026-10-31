import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import type { Processed as Plan } from '../../03architect/process';
import { SECTION_KINDS } from '../../config';
import { PART_WIDTHS, WIDGET_WIDTHS } from '../boxes';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The catalog's system prompt: the table of possible boxes and the section kinds. */
export function catalogSystemPrompt(): string {
  return fillPrompt(load('./prompt.md'), {
    widgetWidths: Object.entries(WIDGET_WIDTHS)
      .map(([kind, { min, max }]) => `- ${kind}: ${min} to ${max || 'fill'}`)
      .join('\n'),
    partWidths: Object.entries(PART_WIDTHS)
      .map(([part, min]) => `- ${part}: ${min}`)
      .join('\n'),
    sectionKinds: SECTION_KINDS.map((kind) => `- ${kind}`).join('\n'),
  });
}

/** The catalog's user message: the processed plan, the flows, the vocabulary and each screen's content width. */
export function catalogUserMessage(
  plan: Plan,
  flows: Flows,
  scope: Scope,
  widths: Record<string, number>,
): string {
  return fillPrompt(load('./input.md'), {
    plan: json(plan),
    flows: json(flows),
    vocabulary: json(scope.vocabulary),
    widths: json(widths),
  });
}

/** The catalog's review guide (D1.12): the output reviewer alone. */
export const catalogReviewGuides = (): ReviewGuides => ({
  output: fillPrompt(load('./review-output.md'), {}),
});
