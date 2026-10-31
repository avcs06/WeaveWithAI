import { fillPrompt, loadPrompt, stripComments } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../01scope/schema';
import { standardSubflowList } from '../../config/subflows';
import { fenced, productManager } from '../../prompts/index';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The call's two review guides (D1.12): the product manager peer, then the output reviewer. */
export const catalogReviewGuides = (): ReviewGuides => ({
  peer: fillPrompt(load('./review-peer.md'), {
    productManager: productManager(),
  }),
  output: fillPrompt(load('./review-output.md'), {}),
});

/** Stage 1's user message: the idea, the scope, and the job. */
export function catalogUserMessage(idea: string, scope: Scope): string {
  return fillPrompt(load('./input.md'), {
    idea: stripComments(idea),
    scope: fenced('Scope (01-flows/01-scope.json)', scope),
    standardSubflows: standardSubflowList(),
  });
}
