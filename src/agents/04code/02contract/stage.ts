import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { hasArtifact, isStale, readArtifact, writeArtifact } from '../../../core/artifacts';
import { appendEvent, runPath, updateStage } from '../../../core/run';
import { appendLedger } from '../../../engine/ledger';
import { saveStagePatch, startStage } from '../../../engine/patches';
import { appCheck, type Check, SIGNED_IN_FILE } from '../../../engine/session';
import { git } from '../../../engine/setup';
import { runSpecStage } from '../../../runner/runSpecStage';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Contract } from '../../03contract/schema';
import type { StageContext, StageDef } from '../../stages';
import { entityFiles, SIGNED_IN } from './codegen';
import { renderEntities } from './render';
import { seedSystemPrompt, seedUserMessage } from './prompts/index';
import { type SeedRows, seedSchema } from './schema';
import { validateSeed } from './validation/validation';

const STAGE = 'code-contract';
const SEED_MAX_TOKENS = 32_768;

/** Tests swap the app's checks. */
type ContractDeps = { check?: (appDir: string, name: string, args: string[]) => Promise<Check> };

/** The seed rows: from the artifact while the contract is unchanged, else from one call. */
async function seedRows(ctx: StageContext, contract: Contract): Promise<SeedRows> {
  const { run, llm } = ctx;
  if (hasArtifact(run, 'code-contract') && !isStale(run, 'code-contract'))
    return readArtifact<SeedRows>(run, 'code-contract').data;
  const scope = readArtifact<Scope>(run, 'flows-scope').data;
  const flows = readArtifact<Flows>(run, 'flows-expand').data;
  const result = await runSpecStage({
    run,
    llm,
    stage: STAGE,
    schema: seedSchema(contract),
    schemaName: 'Seed',
    system: seedSystemPrompt(),
    user: seedUserMessage(scope, flows, contract),
    validate: (seed) => validateSeed({ seed, contract }),
    maxTokens: SEED_MAX_TOKENS,
  });
  writeArtifact(run, 'code-contract', result.output, {
    stage: STAGE,
    model: result.model,
    rounds: result.rounds,
    inputs: ['contract', 'flows-scope', 'flows-expand'],
  });
  return result.output;
}

/** The app's entity layer from the contract, by code; the seed rows are the stage's one model call. */
export async function runContractCode(ctx: StageContext, deps: ContractDeps = {}): Promise<void> {
  const { run } = ctx;
  const contract = readArtifact<Contract>(run, 'contract').data;
  const seed = await seedRows(ctx, contract);
  appendEvent(run, { type: 'stage:start', stage: STAGE });
  const appDir = runPath(run, 'app');
  startStage(run, appDir, STAGE);
  const files = entityFiles(contract, seed);
  files.set('.weave/02-contract/entities.md', renderEntities(contract));
  files.set(SIGNED_IN_FILE, `${JSON.stringify(SIGNED_IN, null, 2)}\n`);
  for (const [file, text] of files) {
    mkdirSync(path.dirname(path.join(appDir, file)), { recursive: true });
    writeFileSync(path.join(appDir, file), text);
  }
  const written = [...files.keys()].filter((file) => file.startsWith('web/'));
  appendLedger(appDir, written.map((file) => ({ path: file, status: 'A', origin: 'code', stage: STAGE })));

  const check = deps.check ?? appCheck;
  const checks: [string, string[]][] = [
    ['validate', ['node', 'tools/validate-files.mjs', ...written]],
    ['typecheck', ['pnpm', 'typecheck']],
    ['lint', ['pnpm', 'nx', 'lint', 'web']],
  ];
  for (const [name, args] of checks) {
    const result = await check(appDir, name, args);
    appendEvent(run, { type: 'check:run', stage: STAGE, name, ok: result.ok });
    if (!result.ok) {
      // Code wrote every file here, so a failing check is a generator bug.
      updateStage(run, STAGE, { status: 'failed' });
      throw new Error(`${STAGE}: ${name} failed in the app:\n${result.output}`);
    }
  }
  git(appDir, 'add', '-A');
  git(appDir, 'commit', '-q', '--allow-empty', '-m', `${STAGE}: entities from the contract`);
  saveStagePatch(run, appDir, STAGE);
  updateStage(run, STAGE, { status: 'done' });
  appendEvent(run, { type: 'stage:done', stage: STAGE });
}

export const contractCodeStage: StageDef = {
  name: STAGE,
  produces: ['code-contract'],
  run: (ctx) => runContractCode(ctx),
};
