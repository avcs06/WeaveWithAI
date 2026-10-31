import { readFileSync, writeFileSync } from 'node:fs';
import {
  type ArtifactName,
  markdownOf,
  readArtifact,
  writeArtifact,
} from '../../core/artifacts';
import { runPath } from '../../core/run';
import { writeJsonAtomic } from '../../core/utils';
import {
  runSpecStage,
  type SpecStageOptions,
  type SpecStageResult,
} from '../../runner/runSpecStage';
import type { StageContext } from '../stages';
import { Scope } from './01scope/schema';
import { readAnswers } from './answers';

/** What every flows stage reads: the idea, the scope and the answers so far. */
export function inputs(ctx: StageContext) {
  const { run } = ctx;
  return {
    idea: readFileSync(runPath(run, 'input', 'idea.md'), 'utf8'),
    scope: readArtifact<Scope>(run, 'flows-scope').data,
    answers: readAnswers(run),
  };
}

/** Runs one stage through the runner and keeps what it produced: answers, artifact, markdown. */
export async function produce<T>(
  ctx: StageContext,
  options: Omit<SpecStageOptions<T>, 'run' | 'llm'>,
  keep: {
    artifact: ArtifactName;
    inputs: ArtifactName[];
    render: (output: T) => string;
    /** Applied to the output before it is written; the catalog adds the standard subflows this way. */
    finish?: (output: T) => T;
  },
): Promise<SpecStageResult<T>> {
  const { run } = ctx;
  const answers = readAnswers(run);
  const result = await runSpecStage({ ...options, run, llm: ctx.llm });
  const output = keep.finish ? keep.finish(result.output) : result.output;
  writeJsonAtomic(runPath(run, 'input', 'answers.json'), {
    ...answers,
    ...result.answers,
  });
  writeArtifact(run, keep.artifact, output, {
    stage: options.stage,
    model: result.model,
    rounds: result.rounds,
    inputs: keep.inputs,
  });
  writeFileSync(runPath(run, markdownOf(keep.artifact)), keep.render(output));
  return result;
}
