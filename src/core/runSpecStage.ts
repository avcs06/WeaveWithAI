import { fileURLToPath } from 'node:url';
import type { z } from 'zod';
import { formatForModel, type Issue, splitIssues, writeReport } from './issues';
import type { ChatMessage, Llm } from './llm';
import { fillPrompt, loadPrompt } from './prompt';
import { appendEvent, type Run, updateStage } from './run';

export class StageFailed extends Error {
  constructor(
    public stage: string,
    public issues: Issue[],
    public rounds: number,
  ) {
    super(`Stage ${stage} failed after ${rounds} rounds with ${issues.length} mandatory issues`);
    this.name = 'StageFailed';
  }
}

export type SpecStageOptions<T> = {
  run: Run;
  stage: string;
  schema: z.ZodType<T>;
  schemaName: string;
  /** The filled prompt. */
  system: string;
  /** The inputs, serialized. */
  user: string;
  validate: (output: T) => Issue[];
  maxRounds?: number;
  llm: Llm;
};

export type SpecStageResult<T> = { output: T; warnings: Issue[]; rounds: number };

const DEFAULT_MAX_ROUNDS = 3;
const STRONG_FROM_ROUND = 3;
const fixupPrompt = loadPrompt(fileURLToPath(new URL('./prompt-fixup.md', import.meta.url)));

/** Generate, validate, send only the mandatory issues back, repeat within the bound. */
export async function runSpecStage<T>(o: SpecStageOptions<T>): Promise<SpecStageResult<T>> {
  const maxRounds = o.maxRounds ?? DEFAULT_MAX_ROUNDS;
  const messages: ChatMessage[] = [
    { role: 'system', content: o.system },
    { role: 'user', content: o.user },
  ];
  appendEvent(o.run, { type: 'stage:start', stage: o.stage });
  updateStage(o.run, o.stage, { status: 'running' });

  for (let round = 1; ; round += 1) {
    const result = await o.llm.generateStructured({
      stage: o.stage,
      round,
      schema: o.schema,
      schemaName: o.schemaName,
      messages,
      model: round >= STRONG_FROM_ROUND ? 'strong' : 'default',
      runDir: o.run.dir,
    });
    appendEvent(o.run, {
      type: 'llm:call',
      stage: o.stage,
      round,
      backend: result.backend,
      model: result.model,
      input: result.usage.input,
      cachedInput: result.usage.cachedInput,
      output: result.usage.output,
      costUsd: result.costUsd,
      replayed: result.replayed,
      durationMs: result.durationMs,
    });

    const issues = o.validate(result.data);
    const { mandatory, warnings } = splitIssues(issues);
    writeReport(o.run, o.stage, round, issues);
    appendEvent(o.run, {
      type: 'stage:round',
      stage: o.stage,
      round,
      mandatory: mandatory.length,
      warnings: warnings.length,
    });

    if (mandatory.length === 0) {
      appendEvent(o.run, { type: 'stage:done', stage: o.stage, rounds: round });
      return { output: result.data, warnings, rounds: round };
    }
    if (round >= maxRounds) {
      appendEvent(o.run, { type: 'stage:failed', stage: o.stage, rounds: round, mandatory: mandatory.length });
      updateStage(o.run, o.stage, { status: 'failed', rounds: round });
      throw new StageFailed(o.stage, mandatory, round);
    }
    messages.push(
      { role: 'assistant', content: result.raw },
      { role: 'user', content: fillPrompt(fixupPrompt, { issues: formatForModel(mandatory) }) },
    );
  }
}
