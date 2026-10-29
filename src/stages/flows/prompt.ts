import { readFileSync } from 'node:fs';
import {
  buildList,
  simulatedList,
  skippedList,
} from '../../config/capabilities';
import { fillPrompt, loadPrompt, stripComments } from '../../core/prompt';
import { pathBeside } from '../../core/utils';
import { Flows, type Scope } from './schema';

/** Question id to the answer given, from input/answers.json or the terminal. */
export type Answers = Record<string, string>;

export function answersBlock(answers: Answers): string {
  const entries = Object.entries(answers);
  if (entries.length === 0) return 'None yet.';
  return entries.map(([id, answer]) => `- ${id}: ${answer}`).join('\n');
}

export function scopeSystemPrompt(answers: Answers): string {
  return fillPrompt(
    loadPrompt(pathBeside(import.meta.url, './prompt-scope.md')),
    {
      capabilitiesBuild: buildList(),
      capabilitiesSimulated: simulatedList(),
      capabilitiesSkipped: skippedList(),
      answers: answersBlock(answers),
    },
  );
}

export function flowsSystemPrompt(answers: Answers): string {
  return fillPrompt(
    loadPrompt(pathBeside(import.meta.url, './prompt-flows.md')),
    {
      capabilitiesBuild: buildList(),
      capabilitiesSimulated: simulatedList(),
      capabilitiesSkipped: skippedList(),
      answers: answersBlock(answers),
      exampleFlow: exampleFlow(),
    },
  );
}

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
