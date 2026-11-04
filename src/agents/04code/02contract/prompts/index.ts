import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import type { Contract } from '../../../03contract/schema';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

export function seedSystemPrompt(): string {
  return load('./prompt.md');
}

/** The product, its words, the flows' example values, and the entities to seed. */
export function seedUserMessage(scope: Scope, flows: Flows, contract: Contract): string {
  return fillPrompt(load('./input.md'), {
    app: json(scope.app),
    vocabulary: json(scope.vocabulary),
    fields: json(flows.fields.map(({ id, label, type, example }) => ({ id, label, type, example }))),
    entities: json({ entities: contract.entities, enums: contract.enums }),
  });
}
