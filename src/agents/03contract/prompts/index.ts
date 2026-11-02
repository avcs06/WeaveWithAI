import { fillPrompt, json, loadPrompt } from '../../../core/prompt';
import { pathBeside } from '../../../core/utils';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Architecture } from '../../02design/02architect/schema';
import { RECORD_FIELDS } from '../schema';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The contract's system prompt: the fields every record already has. */
export function contractSystemPrompt(): string {
  return fillPrompt(load('./prompt.md'), {
    recordFields: RECORD_FIELDS.map((field) => `- ${field}`).join('\n'),
  });
}

/** The contract's user message: the vocabulary, the flows, and the frames, screens and dialogs. */
export function contractUserMessage(
  scope: Scope,
  flows: Flows,
  architecture: Architecture,
): string {
  return fillPrompt(load('./input.md'), {
    vocabulary: json(scope.vocabulary),
    flows: json(flows),
    architecture: json(architecture),
  });
}
