import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { readArtifact, writeArtifact } from '../../core/artifacts';
import type { Config } from '../../core/env';
import type { GenerateInput, Llm } from '../../core/llm';
import { createRun, readState } from '../../core/run';
import { catalog, flows, scope } from '../02design/__fixtures__/chain';
import type { StageContext } from '../stages';
import type { Contract } from './schema';
import { contractStage } from './stage';

const root = mkdtempSync(path.join(tmpdir(), 'weave-contract-stage-'));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '<!-- test -->\n\nA reading list for one reader.\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const contract = JSON.parse(
  readFileSync(new URL('./__fixtures__/reading-list.contract.json', import.meta.url), 'utf8'),
) as Contract;

/** Answers the contract call with the reading-list contract. */
function fakeLlm() {
  const inputs: GenerateInput<unknown>[] = [];
  const llm: Llm = {
    async generateStructured(input) {
      inputs.push(input as GenerateInput<unknown>);
      if (input.schemaName !== 'Contract') throw new Error(`unexpected schema ${input.schemaName}`);
      return {
        data: contract as never,
        raw: JSON.stringify(contract),
        usage: { input: 10, cachedInput: 0, output: 5 },
        costUsd: 0.001,
        replayed: false,
        backend: 'meta',
        model: 'muse-spark-1.3',
        durationMs: 1,
      };
    },
  };
  return { llm, inputs };
}

describe('the contract stage', () => {
  it('writes the contract from the scope, the flows and the catalog in one clean call', async () => {
    const run = createRun({ idea, runsDir: root, id: 'contract' });
    const meta = { model: null, rounds: 1 };
    writeArtifact(run, 'flows-scope', scope, { ...meta, stage: 'flows-scope', inputs: [] });
    writeArtifact(run, 'flows-reconcile', flows, { ...meta, stage: 'flows-reconcile', inputs: ['flows-scope'] });
    writeArtifact(run, 'design-catalog', catalog, { ...meta, stage: 'design-catalog', inputs: ['flows-reconcile'] });
    const { llm, inputs } = fakeLlm();
    const ctx: StageContext = { run, config: { MODEL_API_KEY: 'k', LLM_BACKEND: 'meta' } as Config, llm, interactive: false, backend: 'meta' };

    await contractStage.run(ctx);

    expect(readArtifact<Contract>(run, 'contract')).toMatchObject({
      meta: {
        version: 1,
        stage: 'contract',
        inputs: { 'flows-scope': { version: 1 }, 'flows-reconcile': { version: 1 }, 'design-catalog': { version: 1 } },
      },
      data: contract,
    });
    expect(inputs.map((input) => [input.stage, input.reasoningEffort, input.maxTokens])).toEqual([
      ['contract', 'medium', 32_768],
    ]);
    expect(inputs[0]?.messages.at(-1)?.content).toContain('# Widgets');
    expect(readState(run).stages.contract).toMatchObject({ status: 'done', known: 0 });
  });
});
