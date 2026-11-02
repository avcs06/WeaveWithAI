import type { ChatMessage, ReasoningEffort } from '../../../core/llm';
import {
  type Compose,
  type Draft,
  fixMessage,
} from '../../../runner/runSpecStage';
import type { Scope } from '../01scope/schema';
import type { Catalog } from '../02catalog/schema';
import type { Field, Flow, Flows, Form } from '../schema';
import { expandUserMessage } from './prompts/index';
import { type FlowBatch, FlowBatch as FlowBatchSchema } from './schema';

// One call per flow, so every flow gets the model's full attention; reasoning tokens count toward the 16k budget.
export const EXPAND_BATCH_SIZE = 1;

const EXPAND_MAX_TOKENS = 16_384;

export const batchesOf = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );

type FlowsContext = {
  system: string;
  idea: string;
  scope: Scope;
  reasoningEffort?: ReasoningEffort;
};

/** One expansion call: the named flow written in full, reusing the catalog's parts; a fix resends the issues in the same conversation. */
export function expandCompose(
  ctx: FlowsContext,
  catalog: Catalog,
  flowIds: string[],
  stage: string,
): Compose<FlowBatch> {
  const messages: ChatMessage[] = [
    { role: 'system', content: ctx.system },
    {
      role: 'user',
      content: expandUserMessage(ctx.idea, ctx.scope, catalog, flowIds),
    },
  ];
  const generate = async (
    call: Parameters<Compose<FlowBatch>['draft']>[0],
  ): Promise<Draft<FlowBatch>> => {
    const result = await call({
      stage,
      schema: FlowBatchSchema,
      schemaName: 'FlowBatch',
      messages,
      maxTokens: EXPAND_MAX_TOKENS,
      reasoningEffort: ctx.reasoningEffort,
    });
    return { data: result.data, raw: result.raw, model: result.model };
  };
  return {
    draft: generate,
    fix(call, current, pending, answers) {
      messages.push(
        { role: 'assistant', content: current.raw },
        { role: 'user', content: fixMessage(pending, answers) },
      );
      return generate(call);
    },
  };
}

/**
 * The calls become one document, flows in catalog order. The calls run side by side, so two can give
 * different new parts one id: each new part gets the next free id, or the id of an equal part already
 * there, and its call's steps and forms follow it. A new part with a catalog id is the catalog's part.
 */
export function assemble(catalog: Catalog, batches: FlowBatch[]): Flows {
  const fields = [...catalog.fields];
  const forms = [...catalog.forms];
  const written = new Map<string, Flow>();
  for (const batch of batches) {
    const fieldIds = new Map<string, string>();
    for (const field of batch.newFields) {
      if (catalog.fields.some((known) => known.id === field.id)) continue;
      const same = fields.find((known) => sameField(known, field));
      const id = same?.id ?? nextId('FD', fields);
      fieldIds.set(field.id, id);
      if (!same) fields.push({ ...field, id });
    }
    const formIds = new Map<string, string>();
    for (const newForm of batch.newForms) {
      if (catalog.forms.some((known) => known.id === newForm.id)) continue;
      const form = { ...newForm, fields: newForm.fields.map((id) => fieldIds.get(id) ?? id) };
      const same = forms.find((known) => sameForm(known, form));
      const id = same?.id ?? nextId('FM', forms);
      formIds.set(newForm.id, id);
      if (!same) forms.push({ ...form, id });
    }
    for (const flow of batch.flows)
      written.set(flow.id, {
        ...flow,
        steps: flow.steps.map((step) => ({
          ...step,
          fields: step.fields.map((id) => fieldIds.get(id) ?? id),
          form: formIds.get(step.form) ?? step.form,
        })),
      });
  }
  const flows = catalog.flows.flatMap((header) => {
    const flow = written.get(header.id);
    return flow ? [flow] : [];
  });
  // A flow a batch added beyond the catalog keeps its place after the catalog's.
  for (const [id, flow] of written)
    if (!catalog.flows.some((header) => header.id === id)) flows.push(flow);
  return {
    flows,
    fields,
    forms,
    assumptions: catalog.assumptions,
    questions: catalog.questions,
  };
}

/** Fields and forms no step asks for come out, so later stages build none of them; a field counts through a form a step uses. */
export function dropUnused(doc: Flows): Flows {
  const steps = doc.flows.flatMap((flow) => flow.steps);
  const usedForms = new Set(steps.map((step) => step.form));
  const usedFields = new Set([
    ...steps.flatMap((step) => step.fields),
    ...doc.forms.filter((form) => usedForms.has(form.id)).flatMap((form) => form.fields),
  ]);
  return {
    ...doc,
    fields: doc.fields.filter((field) => usedFields.has(field.id)),
    forms: doc.forms.filter((form) => usedForms.has(form.id)),
  };
}

// Equal values: meanings and examples are free text that two calls word differently.
const sameField = (a: Field, b: Field): boolean =>
  a.noun === b.noun &&
  a.label.toLowerCase() === b.label.toLowerCase() &&
  a.type === b.type &&
  a.optionsFrom === b.optionsFrom &&
  a.options.join('\n') === b.options.join('\n');

const sameForm = (a: Form, b: Form): boolean =>
  a.name.toLowerCase() === b.name.toLowerCase() &&
  [...a.fields].sort().join() === [...b.fields].sort().join();

const nextId = (prefix: string, parts: { id: string }[]): string => {
  const top = Math.max(0, ...parts.map((part) => Number(part.id.slice(prefix.length)) || 0));
  return `${prefix}${String(top + 1).padStart(2, '0')}`;
};
