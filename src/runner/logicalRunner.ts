import { runSpecStage, type SpecStageOptions, type SpecStageResult } from './runSpecStage';

/** A stage with one right answer: the usual rounds, nothing more. It exists so a stage says which kind it is. */
export const logicalRunner = <T>(o: SpecStageOptions<T>): Promise<SpecStageResult<T>> => runSpecStage(o);
