import { formatIssues } from '../../../core/issues';
import type { ReasoningEffort } from '../../../core/llm';
import {
  type Answers,
  type Compose,
  formatAnswers,
} from '../../../runner/runSpecStage';
import type { Scope } from '../01scope/schema';
import type { Flow, Flows } from '../schema';
import { patchUserMessage } from './prompts/index';
import { FlowsPatch } from './schema';

// Reasoning tokens count toward the budget (D1.13); the patch returns only changes.

const PATCH_MAX_TOKENS = 16_384;

type FlowsContext = {
  system: string;
  idea: string;
  scope: Scope;
  reasoningEffort?: ReasoningEffort;
};

/** Reconciliation: never drafts; each fix asks for a patch against the current document and applies it. */
export function reconcileCompose(
  ctx: FlowsContext,
  stage: string,
): Compose<Flows> {
  return {
    draft() {
      return Promise.reject(
        new Error(
          'reconciliation starts from the draft; it never generates a first document',
        ),
      );
    },
    async fix(call, current, pending, answers) {
      const result = await call({
        stage,
        schema: FlowsPatch,
        schemaName: 'FlowsPatch',
        messages: [
          { role: 'system', content: ctx.system },
          {
            role: 'user',
            content: patchUserMessage(
              ctx.idea,
              ctx.scope,
              current.data,
              formatIssues(pending),
              answersText(answers),
            ),
          },
        ],
        maxTokens: PATCH_MAX_TOKENS,
        reasoningEffort: ctx.reasoningEffort,
      });
      const data = applyPatch(current.data, result.data);
      return { data, raw: JSON.stringify(data), model: result.model };
    },
  };
}

/** Patches win over the current document: same id or name replaces, a new one is added, removed flows go. */
export function applyPatch(flows: Flows, patch: FlowsPatch): Flows {
  const removed = new Set(patch.removeFlows);
  return {
    flows: upsert(flows.flows, patch.upsertFlows, (flow) => flow.id).filter(
      (flow: Flow) => !removed.has(flow.id),
    ),
    fields: upsert(flows.fields, patch.upsertFields, (field) => field.id),
    forms: upsert(flows.forms, patch.upsertForms, (form) => form.id),
    subflows: upsert(
      flows.subflows,
      patch.upsertSubflows,
      (subflow) => subflow.id,
    ),
    assumptions: [...flows.assumptions, ...patch.assumptions],
    questions: [...flows.questions, ...patch.questions],
  };
}

function upsert<T>(current: T[], changes: T[], key: (item: T) => string): T[] {
  const byKey = new Map(changes.map((item) => [key(item), item]));
  const kept = current.map((item) => byKey.get(key(item)) ?? item);
  const added = changes.filter(
    (item) => !current.some((existing) => key(existing) === key(item)),
  );
  return [...kept, ...added];
}

const answersText = (answers: Answers): string =>
  Object.keys(answers).length > 0 ? formatAnswers(answers) : 'None.';
