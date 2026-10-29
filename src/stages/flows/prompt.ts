import { readFileSync } from 'node:fs';
import {
  buildList,
  simulatedList,
  skippedList,
} from '../../config/capabilities';
import { fillPrompt, loadPrompt, stripComments } from '../../core/prompt';
import { type Answers, formatAnswers } from '../../core/runSpecStage';
import { pathBeside } from '../../core/utils';
import { Flows, type Scope } from './schema';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The standard both prompts and both review guides share. */
const productManager = () => load('./product-manager.md');

const capabilityLists = () => ({
  capabilitiesBuild: buildList(),
  capabilitiesSimulated: simulatedList(),
  capabilitiesSkipped: skippedList(),
});

export function answersBlock(answers: Answers): string {
  return Object.keys(answers).length === 0
    ? 'None yet.'
    : formatAnswers(answers);
}

export function scopeSystemPrompt(answers: Answers): string {
  return fillPrompt(load('./prompt-scope.md'), {
    productManager: productManager(),
    ...capabilityLists(),
    answers: answersBlock(answers),
  });
}

export function flowsSystemPrompt(answers: Answers): string {
  return fillPrompt(load('./prompt-flows.md'), {
    productManager: productManager(),
    ...capabilityLists(),
    answers: answersBlock(answers),
    exampleFlow: exampleFlow(),
  });
}

export const scopeReviewGuide = (): string =>
  fillPrompt(load('./review-scope.md'), { productManager: productManager() });

export const flowsReviewGuide = (): string =>
  fillPrompt(load('./review-flows.md'), { productManager: productManager() });

/** The "add a book" flow from the reading-list fixture; never a reference idea's flow. */
function exampleFlow(): string {
  const fixture = Flows.parse(
    JSON.parse(
      readFileSync(
        pathBeside(import.meta.url, './__fixtures__/reading-list.flows.json'),
        'utf8',
      ),
    ),
  );
  const flow = fixture.flows.find((candidate) => candidate.id === 'F03');
  if (!flow) throw new Error('The reading-list fixture has no flow F03');
  return JSON.stringify(flow, null, 2);
}

/** Idea text as written, minus the HTML comments the idea files keep for us. */
export function scopeUserMessage(idea: string): string {
  return `# Idea\n\n${stripComments(idea)}`;
}

export function flowsUserMessage(idea: string, scope: Scope): string {
  const scopeJson = JSON.stringify(scope, null, 2);
  return `${scopeUserMessage(idea)}\n\n# Scope (01-scope.json)\n\n\`\`\`json\n${scopeJson}\n\`\`\``;
}
