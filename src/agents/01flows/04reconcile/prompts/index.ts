import { fillPrompt, loadPrompt, stripComments } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Scope } from '../../01scope/schema';
import { fenced } from '../../prompts/index';
import { Flows } from '../../schema';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** Stage 3's user message: the idea, the scope, the current document, and what to fix. */
export function patchUserMessage(
  idea: string,
  scope: Scope,
  flows: Flows,
  issues: string,
  answers: string,
): string {
  return fillPrompt(load('./input.md'), {
    idea: stripComments(idea),
    scope: fenced('Scope (01-flows/01-scope.json)', scope),
    flows: fenced('Current flows (01-flows/03-expand.json)', flows),
    issues,
    answers,
  });
}
