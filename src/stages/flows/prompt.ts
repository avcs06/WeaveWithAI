import { readFileSync } from 'node:fs';
import {
  buildList,
  simulatedList,
  skippedList,
} from '../../config/capabilities';
import { fillPrompt, loadPrompt, stripComments } from '../../core/prompt';
import { type Answers, formatAnswers } from '../../core/runSpecStage';
import { pathBeside } from '../../core/utils';
import { type Catalog, Flows, type Scope } from './schema';

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

export const catalogReviewGuide = (): string =>
  fillPrompt(load('./review-flows-catalog.md'), {
    productManager: productManager(),
  });

export const expandReviewGuide = (): string =>
  fillPrompt(load('./review-flows-expand.md'), {
    productManager: productManager(),
  });

/** The "add a book" flow from the reading-list fixture with the parts it uses; never a reference idea's flow. */
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
  const forms = fixture.forms.filter((form) =>
    flow.steps.some((step) => step.form === form.id),
  );
  const ids = new Set([
    ...forms.flatMap((form) => form.fields),
    ...flow.steps.flatMap((step) => step.fields),
  ]);
  const example = {
    flow,
    fields: fixture.fields.filter((field) => ids.has(field.id)),
    forms,
  };
  return JSON.stringify(example, null, 2);
}

/** Idea text as written, minus the HTML comments the idea files keep for us. */
export function scopeUserMessage(idea: string): string {
  return `# Idea\n\n${stripComments(idea)}`;
}

const fenced = (title: string, value: unknown): string =>
  `# ${title}\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;

/** Stage 1's user message: the idea, the scope, and the job. */
export function catalogUserMessage(idea: string, scope: Scope): string {
  return fillPrompt(load('./prompt-flows-catalog.md'), {
    idea: stripComments(idea),
    scope: fenced('Scope (01-scope.json)', scope),
  });
}

/** Stage 2's user message for one batch: the idea, the scope, the whole catalog, and the flow ids to expand. */
export function expandUserMessage(
  idea: string,
  scope: Scope,
  catalog: Catalog,
  flowIds: string[],
): string {
  return fillPrompt(load('./prompt-flows-expand.md'), {
    idea: stripComments(idea),
    scope: fenced('Scope (01-scope.json)', scope),
    catalog: fenced('Catalog (01-flows-catalog.json)', catalog),
    flowIds: flowIds.join(', '),
  });
}

/** Stage 3's user message: the idea, the scope, the current document, and what to fix. */
export function patchUserMessage(
  idea: string,
  scope: Scope,
  flows: Flows,
  issues: string,
  answers: string,
): string {
  return fillPrompt(load('./prompt-flows-patch.md'), {
    idea: stripComments(idea),
    scope: fenced('Scope (01-scope.json)', scope),
    flows: fenced('Current flows (01-flows-draft.json)', flows),
    issues,
    answers,
  });
}
