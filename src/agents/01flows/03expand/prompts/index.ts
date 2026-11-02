import { fillPrompt, loadPrompt, stripComments } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../01scope/schema';
import type { Catalog } from '../../02catalog/schema';
import { fenced, productManager } from '../../prompts/index';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The call's two review guides: the product manager peer, then the output reviewer. */
export const expandReviewGuides = (): ReviewGuides => ({
  peer: fillPrompt(load('./review-peer.md'), {
    productManager: productManager(),
  }),
  output: fillPrompt(load('./review-output.md'), {}),
});

/** The user message of the assembly round: the idea and the scope; the document follows as the assistant's turn. */
export function assembleUserMessage(idea: string, scope: Scope): string {
  return fillPrompt(load('./assemble.md'), {
    idea: stripComments(idea),
    scope: fenced('Scope (01-flows/01-scope.json)', scope),
  });
}

/** The user message of one expansion call: the idea, the scope, the whole catalog, and the flow to expand. */
export function expandUserMessage(
  idea: string,
  scope: Scope,
  catalog: Catalog,
  flowIds: string[],
): string {
  return fillPrompt(load('./input.md'), {
    idea: stripComments(idea),
    scope: fenced('Scope (01-flows/01-scope.json)', scope),
    catalog: fenced('Catalog (01-flows/02-catalog.json)', catalog),
    flowIds: flowIds.join(', '),
  });
}
