import { fillPrompt, json, loadPrompt } from '../../../core/prompt';
import { pathBeside } from '../../../core/utils';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Defined } from '../../02design/03catalog/process';
import { RECORD_FIELDS } from '../schema';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The contract's system prompt: the fields every record already has. */
export function contractSystemPrompt(): string {
  return fillPrompt(load('./prompt.md'), {
    recordFields: RECORD_FIELDS.map((field) => `- ${field}`).join('\n'),
  });
}

/** The contract's user message: the vocabulary, the flows, and what the contract reads of each widget. */
export function contractUserMessage(scope: Scope, flows: Flows, widgets: Defined[]): string {
  return fillPrompt(load('./input.md'), {
    vocabulary: json(scope.vocabulary),
    flows: json(flows),
    widgets: json(
      widgets.map(({ id, name, holds, flowSteps, data, repeat, fields }) => ({
        id,
        name,
        holds,
        flowSteps,
        data,
        repeat,
        fields,
      })),
    ),
  });
}
