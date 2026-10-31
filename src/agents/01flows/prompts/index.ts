import { readFileSync } from 'node:fs';
import { fillPrompt, loadPrompt } from '../../../core/prompt';
import { pathBeside } from '../../../core/utils';
import { type Answers, formatAnswers } from '../../../runner/runSpecStage';
import { buildList, simulatedList, skippedList } from '../config/capabilities';
import { Flows } from '../schema';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The standard both prompts and both review guides share. */
export const productManager = () => load('./product-manager.md');

export const capabilityLists = () => ({
  capabilitiesBuild: buildList(),
  capabilitiesSimulated: simulatedList(),
  capabilitiesSkipped: skippedList(),
});

export function answersBlock(answers: Answers): string {
  return Object.keys(answers).length === 0
    ? 'None yet.'
    : formatAnswers(answers);
}

export function flowsSystemPrompt(answers: Answers): string {
  return fillPrompt(load('./flows.md'), {
    productManager: productManager(),
    ...capabilityLists(),
    answers: answersBlock(answers),
    exampleFlows: exampleFlows(),
  });
}

/** The "add a book" and "delete a book" flows from the reading-list fixture with the parts they use: one fills a form, one runs the standard delete subflow. Never a reference idea's flow. */
function exampleFlows(): string {
  const fixture = Flows.parse(
    JSON.parse(
      readFileSync(
        pathBeside(import.meta.url, '../__fixtures__/reading-list.flows.json'),
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

export const fenced = (title: string, value: unknown): string =>
  `# ${title}\n\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
