import type { ChatMessage, ReasoningEffort } from '../../../core/llm';
import {
  type Compose,
  type Draft,
  fixMessage,
} from '../../../runner/runSpecStage';
import type { Scope } from '../01scope/schema';
import type { Catalog } from '../02catalog/schema';
import type { Flows } from '../schema';
import { expandUserMessage } from './prompts/index';
import { type FlowBatch, FlowBatch as FlowBatchSchema } from './schema';

// Reasoning tokens count toward the budget (D1.13). A batch of eight flows fits well inside 16k.
export const EXPAND_BATCH_SIZE = 8;

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

/** One expansion batch: the named flows written in full, reusing the catalog's parts; a fix resends the issues in the same conversation. */
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

/** The batches become one document: flows in catalog order, parts deduplicated with the catalog's definition first. */
export function assemble(catalog: Catalog, batches: FlowBatch[]): Flows {
  const written = new Map(
    batches.flatMap((batch) =>
      batch.flows.map((flow) => [flow.id, flow] as const),
    ),
  );
  const flows = catalog.flows.flatMap((header) => {
    const flow = written.get(header.id);
    return flow ? [flow] : [];
  });
  // A flow a batch added beyond the catalog keeps its place after the catalog's.
  for (const [id, flow] of written)
    if (!catalog.flows.some((header) => header.id === id)) flows.push(flow);
  return {
    flows,
    fields: dedupe(
      [...catalog.fields, ...batches.flatMap((batch) => batch.newFields)],
      (field) => field.id,
    ),
    forms: dedupe(
      [...catalog.forms, ...batches.flatMap((batch) => batch.newForms)],
      (form) => form.id,
    ),
    subflows: dedupe(
      [...catalog.subflows, ...batches.flatMap((batch) => batch.newSubflows)],
      (subflow) => subflow.id,
    ),
    assumptions: catalog.assumptions,
    questions: catalog.questions,
  };
}

function dedupe<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) =>
    seen.has(key(item)) ? false : (seen.add(key(item)), true),
  );
}
