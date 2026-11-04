import path from 'node:path';
import type { StageDef } from '../agents/stages';
import { appendEvent, updateStage } from '../core/run';
import { runBenchmark } from './index';

// The pipeline's last stage: measures the app the code stages built. It writes
// no artifact, only benchmark.json and 05-benchmark.md, and calls no model.

const STAGE = 'bench';

export const benchStage: StageDef = {
  name: STAGE,
  produces: [],
  async run(ctx) {
    appendEvent(ctx.run, { type: 'stage:start', stage: STAGE });
    updateStage(ctx.run, STAGE, { status: 'running' });
    // Its runs folder holds the other runs, whose readings give the subscription's allowance before this one.
    await runBenchmark(ctx.run, path.dirname(ctx.run.dir), { out: () => {} });
    updateStage(ctx.run, STAGE, { status: 'done' });
    appendEvent(ctx.run, { type: 'stage:done', stage: STAGE });
  },
};
