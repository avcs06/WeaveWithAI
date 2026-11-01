import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { hasArtifact, writeArtifact } from '../../../core/artifacts';
import type { Config } from '../../../core/env';
import type { GenerateInput, Llm } from '../../../core/llm';
import { createRun, readState, runPath } from '../../../core/run';
import type { Check } from '../../../engine/session';
import { git } from '../../../engine/setup';
import type { Contract } from '../../03contract/schema';
import type { StageContext } from '../../stages';
import { fakeSeed } from './__fixtures__/seed';
import { runContractCode } from './stage';

const root = mkdtempSync(path.join(tmpdir(), 'weave-contract-code-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '# An idea\n');
const golden = (file: string) => JSON.parse(readFileSync(`fixtures/golden/freelancer-workspace/${file}`, 'utf8')).data;
const contract = golden('03-contract.json') as Contract;

function setup(id: string) {
  const run = createRun({ idea, runsDir: root, id });
  for (const [name, file] of [
    ['flows-scope', '01-flows/01-scope.json'],
    ['flows-reconcile', '01-flows/04-reconcile.json'],
    ['contract', '03-contract.json'],
  ] as const)
    writeArtifact(run, name, golden(file), { stage: name, model: null, rounds: 1, inputs: [] });
  const appDir = runPath(run, 'app');
  mkdirSync(appDir, { recursive: true });
  git(appDir, 'init', '-q');
  const calls: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      calls.push(input as GenerateInput<unknown>);
      const data = fakeSeed(contract);
      return { data: data as never, raw: JSON.stringify(data), usage: { input: 10, cachedInput: 0, output: 5 }, costUsd: 0.001, replayed: false, backend: 'meta', model: 'muse-spark-1.3', durationMs: 1 };
    },
  };
  const ran: string[] = [];
  const check = async (_dir: string, name: string): Promise<Check> => {
    ran.push(name);
    return { name, ok: true, output: '' };
  };
  const ctx: StageContext = { run, config: { MODEL_API_KEY: 'k', LLM_BACKEND: 'meta' } as Config, llm, interactive: false, backend: 'meta' };
  return { run, appDir, ctx, calls, ran, check };
}

describe('the contract code stage', () => {
  it('seeds with one call, writes the layer and its doc, records it, checks it and commits it', async () => {
    const { run, appDir, ctx, calls, ran, check } = setup('first');
    await runContractCode(ctx, { check });

    expect(calls.map((c) => c.schemaName)).toEqual(['Seed']);
    expect(hasArtifact(run, 'code-contract')).toBe(true);
    expect(existsSync(path.join(appDir, 'web/app/entities/client/operations.ts'))).toBe(true);
    expect(readFileSync(path.join(appDir, '.weave/02-contract/entities.md'), 'utf8')).toContain('`@app/entities/client`');
    const ledger = JSON.parse(readFileSync(path.join(appDir, '.weave/ledger.json'), 'utf8'));
    expect(ledger).toContainEqual({ path: 'web/app/entities/client/store.ts', status: 'A', origin: 'code', stage: 'code-contract' });
    expect(ran).toEqual(['validate', 'typecheck', 'lint']);
    expect(git(appDir, 'status', '--porcelain')).toBe('');
    expect(readState(run).stages['code-contract']).toMatchObject({ status: 'done' });

    // A rerun with the contract unchanged keeps the seed and makes no call.
    await runContractCode(ctx, { check });
    expect(calls).toHaveLength(1);
  });
});
