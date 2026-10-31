import { readFileSync } from 'node:fs';
import {
  buildList,
  simulatedList,
  skippedList,
} from '../../config/capabilities';
import { standardSubflowList } from '../../config/subflows';
import { fillPrompt, loadPrompt, stripComments } from '../../core/prompt';
import {
  type Answers,
  formatAnswers,
  type ReviewGuides,
} from '../../core/runSpecStage';
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
    exampleFlows: exampleFlows(),
  });
}

/** A call's two review guides (D1.12): the product manager peer, then the output reviewer. */
const reviewGuides = (name: string): ReviewGuides => ({
  peer: fillPrompt(load(`./review-${name}-peer.md`), {
    productManager: productManager(),
  }),
  output: fillPrompt(load(`./review-${name}-output.md`), {}),
});

export const scopeReviewGuides = (): ReviewGuides => reviewGuides('scope');
export const catalogReviewGuides = (): ReviewGuides =>
  reviewGuides('flows-catalog');
export const expandReviewGuides = (): ReviewGuides =>
  reviewGuides('flows-expand');

/** The "add a book" and "delete a book" flows from the reading-list fixture with the parts they use: one fills a form, one runs the standard delete subflow. Never a reference idea's flow. */
function exampleFlows(): string {
  const fixture = Flows.parse(
    JSON.parse(
      readFileSync(
        pathBeside(import.meta.url, './__fixtures__/reading-list.flows.json'),
        'utf8',
      ),
    ),
  );
  const flows = ['F03', 'F05'].map((id) => {
    const flow = fixture.flows.find((candidate) => candidate.id === id);
    if (!flow) throw new Error(`The reading-list fixture has no flow ${id}`);
    return flow;
  });
  const steps = flows.flatMap((flow) => flow.steps);
  const forms = fixture.forms.filter((form) =>
    steps.some((step) => step.form === form.id),
  );
  const ids = new Set([
    ...forms.flatMap((form) => form.fields),
    ...steps.flatMap((step) => step.fields),
  ]);
  const example = {
    flows,
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
    standardSubflows: standardSubflowList(),
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
    standardSubflows: standardSubflowList(),
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
