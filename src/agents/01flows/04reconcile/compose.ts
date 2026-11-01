import { formatIssues } from '../../../core/issues';
import type { ReasoningEffort } from '../../../core/llm';
import {
  type Answers,
  type Compose,
  formatAnswers,
} from '../../../runner/runSpecStage';
import type { Scope } from '../01scope/schema';
import { applyPatch } from '../../../runner/patch';
import type { Flows } from '../schema';
import { patchUserMessage } from './prompts/index';
import { FLOWS_KEYS, FlowsPatch } from './schema';

// Reasoning tokens count toward the budget; the patch returns only changes.

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
      const data = applyPatch(current.data, result.data, FLOWS_KEYS);
      return { data, raw: JSON.stringify(data), model: result.model };
    },
  };
}

const answersText = (answers: Answers): string =>
  Object.keys(answers).length > 0 ? formatAnswers(answers) : 'None.';
