import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import {
  type ArtifactName,
  readArtifact,
  writeArtifact,
} from '../../core/artifacts';
import { appendEvent, type Run, runPath, updateStage } from '../../core/run';
import {
  type Answers,
  type Draft,
  runSpecStage,
  type SpecStageOptions,
  type SpecStageResult,
} from '../../core/runSpecStage';
import { writeJsonAtomic } from '../../core/utils';
import type { StageContext, StageDef } from '../index';
import {
  assemble,
  batchesOf,
  EXPAND_BATCH_SIZE,
  expandCompose,
  reconcileCompose,
} from './compose';
import {
  catalogReviewGuide,
  catalogUserMessage,
  expandReviewGuide,
  expandUserMessage,
  flowsSystemPrompt,
  patchUserMessage,
  scopeReviewGuide,
  scopeSystemPrompt,
  scopeUserMessage,
} from './prompt';
import { renderCatalog, renderFlows, renderScope } from './render';
import { Catalog, FlowBatch, Flows, type Question, Scope } from './schema';
import {
  validateBatch,
  validateCatalog,
  validateFlows,
  validateScope,
} from './validate';

// Reasoning tokens count toward the budget (D1.13); the catalog carries every header and part, the batches are small.
const SCOPE_MAX_TOKENS = 16_384;
const CATALOG_MAX_TOKENS = 32_768;
// The model's own reasoning level overran even the catalog's budget on the freelancer idea; medium keeps room for the JSON (D1.13).
const FLOWS_EFFORT = 'medium';

export function readAnswers(run: Run): Answers {
  const file = runPath(run, 'input', 'answers.json');
  return existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as Answers)
    : {};
}

/** Reads one line from the terminal; tests pass their own. */
export type AskIo = (prompt: string) => Promise<string>;

const readLine: AskIo = async (prompt) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(prompt);
  } finally {
    rl.close();
  }
};

/** Asks the blocking questions not answered yet, once each; Enter keeps the default, which then counts as the answer. */
export function terminalAsk(
  known: Answers,
  io: AskIo = readLine,
  out: (line: string) => void = console.log,
) {
  const asked = new Set<string>();
  // An earlier run's answer counts for the same question only; a fresh draft may reuse the id for another one.
  const answeredBefore = (q: Question) => known[q.id]?.question === q.question;
  return async ({ questions }: { questions: Question[] }): Promise<Answers> => {
    const answers: Answers = {};
    for (const question of questions.filter(
      (q) => q.blocking && !asked.has(q.id) && !answeredBefore(q),
    )) {
      asked.add(question.id);
      out(
        `\n${question.id}: ${question.question}\n  Why: ${question.whyItMatters}\n  Default: ${question.defaultAnswer}`,
      );
      const typed = (await io('  Answer (Enter keeps the default): ')).trim();
      answers[question.id] = {
        question: question.question,
        answer: typed === '' ? question.defaultAnswer : typed,
      };
    }
    return answers;
  };
}

/** What every flows stage reads: the idea, the scope and the answers so far. */
function inputs(ctx: StageContext) {
  const { run } = ctx;
  return {
    idea: readFileSync(runPath(run, 'input', 'idea.md'), 'utf8'),
    scope: readArtifact<Scope>(run, 'scope').data,
    answers: readAnswers(run),
  };
}

/** Runs one stage through the runner and keeps what it produced: answers, artifact, markdown. */
async function produce<T>(
  ctx: StageContext,
  options: Omit<SpecStageOptions<T>, 'run' | 'llm'>,
  keep: {
    artifact: ArtifactName;
    inputs: ArtifactName[];
    render: (output: T) => string;
  },
): Promise<SpecStageResult<T>> {
  const { run } = ctx;
  const answers = readAnswers(run);
  const result = await runSpecStage({ ...options, run, llm: ctx.llm });
  writeJsonAtomic(runPath(run, 'input', 'answers.json'), {
    ...answers,
    ...result.answers,
  });
  writeArtifact(run, keep.artifact, result.output, {
    stage: options.stage,
    model: result.model,
    rounds: result.rounds,
    inputs: keep.inputs,
  });
  writeFileSync(
    runPath(run, `01-${keep.artifact}.md`),
    keep.render(result.output),
  );
  return result;
}

async function runScope(ctx: StageContext): Promise<void> {
  const idea = readFileSync(runPath(ctx.run, 'input', 'idea.md'), 'utf8');
  const answers = readAnswers(ctx.run);
  await produce(
    ctx,
    {
      stage: 'scope',
      schema: Scope,
      schemaName: 'Scope',
      system: scopeSystemPrompt(answers),
      user: scopeUserMessage(idea),
      validate: validateScope,
      review: scopeReviewGuide(),
      ask: ctx.interactive ? terminalAsk(answers) : undefined,
      maxTokens: SCOPE_MAX_TOKENS,
    },
    { artifact: 'scope', inputs: [], render: renderScope },
  );
}

/** Stage 1: every flow's header and description plus the reusable parts, through the runner like scope. */
async function runCatalog(ctx: StageContext): Promise<void> {
  const { idea, scope, answers } = inputs(ctx);
  await produce(
    ctx,
    {
      stage: 'flows-catalog',
      schema: Catalog,
      schemaName: 'FlowCatalog',
      system: flowsSystemPrompt(answers),
      user: catalogUserMessage(idea, scope),
      validate: (catalog) => validateCatalog(catalog, scope),
      review: catalogReviewGuide(),
      ask: ctx.interactive ? terminalAsk(answers) : undefined,
      maxTokens: CATALOG_MAX_TOKENS,
      reasoningEffort: FLOWS_EFFORT,
    },
    {
      artifact: 'flows-catalog',
      inputs: ['scope'],
      render: (catalog) => renderCatalog(catalog, scope),
    },
  );
}

/** Stage 2: the catalog's flows in batches, each batch a stage of its own run in parallel, assembled into the draft. */
async function runExpand(ctx: StageContext): Promise<void> {
  const { run } = ctx;
  const { idea, scope, answers } = inputs(ctx);
  const catalog = readArtifact<Catalog>(run, 'flows-catalog').data;
  const system = flowsSystemPrompt(answers);
  appendEvent(run, { type: 'stage:start', stage: 'flows-expand' });
  updateStage(run, 'flows-expand', { status: 'running' });

  const batches = batchesOf(
    catalog.flows.map((flow) => flow.id),
    EXPAND_BATCH_SIZE,
  );
  const results = await Promise.all(
    batches.map((flowIds, i) => {
      const stage = `flows-expand-${i + 1}`;
      return runSpecStage<FlowBatch>({
        run,
        stage,
        schema: FlowBatch,
        schemaName: 'FlowBatch',
        system,
        user: expandUserMessage(idea, scope, catalog, flowIds),
        validate: (batch) => validateBatch(batch, catalog, scope),
        review: expandReviewGuide(),
        compose: expandCompose(
          { system, idea, scope, reasoningEffort: FLOWS_EFFORT },
          catalog,
          flowIds,
          stage,
        ),
        llm: ctx.llm,
      }).then((result) => {
        // The runner leaves the status to its caller; a batch has no artifact of its own, so it is done here.
        updateStage(run, stage, { status: 'done' });
        return result;
      });
    }),
  );
  const draft = Flows.parse(
    assemble(
      catalog,
      results.map((result) => result.output),
    ),
  );
  const rounds = results.reduce((sum, result) => sum + result.rounds, 0);
  const known = results.reduce((sum, result) => sum + result.known.length, 0);
  writeArtifact(run, 'flows-draft', draft, {
    stage: 'flows-expand',
    model: results[0]?.model ?? 'none',
    rounds,
    inputs: ['scope', 'flows-catalog'],
  });
  updateStage(run, 'flows-expand', { rounds, known, batches: batches.length });
  appendEvent(run, {
    type: 'stage:done',
    stage: 'flows-expand',
    rounds,
    known,
    batches: batches.length,
  });
}

/** Stage 3: starts from the draft, validates the whole document, and patches until the validators are clean. */
async function runReconcile(ctx: StageContext): Promise<void> {
  const { run } = ctx;
  const { idea, scope, answers } = inputs(ctx);
  const envelope = readArtifact<Flows>(run, 'flows-draft');
  const draft = envelope.data;
  const system = flowsSystemPrompt(answers);
  const start: Draft<Flows> = {
    data: draft,
    raw: JSON.stringify(draft),
    model: envelope.meta.model ?? 'none',
  };
  await produce(
    ctx,
    {
      stage: 'flows',
      schema: Flows,
      schemaName: 'Flows',
      system,
      user: patchUserMessage(idea, scope, draft, 'None yet.', 'None.'),
      validate: (flows) => validateFlows(flows, scope),
      ask: ctx.interactive ? terminalAsk(answers) : undefined,
      compose: reconcileCompose(
        { system, idea, scope, reasoningEffort: FLOWS_EFFORT },
        'flows-patch',
      ),
      start,
    },
    {
      artifact: 'flows',
      inputs: ['scope', 'flows-catalog', 'flows-draft'],
      render: (flows) => renderFlows(flows, scope),
    },
  );
}

export const scopeStage: StageDef = {
  name: 'scope',
  produces: ['scope'],
  run: runScope,
  validate: (run) => validateScope(readArtifact<Scope>(run, 'scope').data),
};

export const catalogStage: StageDef = {
  name: 'flows-catalog',
  produces: ['flows-catalog'],
  run: runCatalog,
  validate: (run) =>
    validateCatalog(
      readArtifact<Catalog>(run, 'flows-catalog').data,
      readArtifact<Scope>(run, 'scope').data,
    ),
};

export const expandStage: StageDef = {
  name: 'flows-expand',
  produces: ['flows-draft'],
  run: runExpand,
  validate: (run) =>
    validateFlows(
      readArtifact<Flows>(run, 'flows-draft').data,
      readArtifact<Scope>(run, 'scope').data,
    ),
};

export const flowsStage: StageDef = {
  name: 'flows',
  produces: ['flows'],
  run: runReconcile,
  validate: (run) =>
    validateFlows(
      readArtifact<Flows>(run, 'flows').data,
      readArtifact<Scope>(run, 'scope').data,
    ),
};
