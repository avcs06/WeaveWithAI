import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import type { Brief, Layouts } from '../../01theme/schema';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The architect's system prompt: the job, and how frames, screens and dialogs are written. */
export const architectSystemPrompt = (): string =>
  fillPrompt(load('./prompt.md'), {});

/** The architect's user message: the scope, the flows, the brief and the theme's two page layouts. */
export function architectUserMessage(
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

/** The architect's two review guides: the product designer peer, then the output reviewer. */
export const architectReviewGuides = (): ReviewGuides => ({
  peer: guide('review-peer'),
  output: guide('review-output'),
});
