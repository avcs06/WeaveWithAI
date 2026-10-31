import { fillPrompt, loadPrompt, stripComments } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Answers, ReviewGuides } from '../../../../runner/runSpecStage';
import {
  answersBlock,
  capabilityLists,
  productManager,
} from '../../prompts/index';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

export function scopeSystemPrompt(answers: Answers): string {
  return fillPrompt(load('./prompt.md'), {
    productManager: productManager(),
    ...capabilityLists(),
    answers: answersBlock(answers),
  });
}

/** The call's two review guides (D1.12): the product manager peer, then the output reviewer. */
export const scopeReviewGuides = (): ReviewGuides => ({
  peer: fillPrompt(load('./review-peer.md'), {
    productManager: productManager(),
  }),
  output: fillPrompt(load('./review-output.md'), {}),
});

/** Idea text as written, minus the HTML comments the idea files keep for us. */
export function scopeUserMessage(idea: string): string {
  return `# Idea\n\n${stripComments(idea)}`;
}
