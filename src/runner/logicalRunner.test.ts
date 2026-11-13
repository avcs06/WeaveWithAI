import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { GenerateInput, Llm } from '../core/llm';
import { createRun } from '../core/run';
import { logicalRunner } from './logicalRunner';
import type { Review } from './review';
import { runSpecStage, type SpecStageOptions } from './runSpecStage';

const root = mkdtempSync(path.join(tmpdir(), 'weave-logical-'));
const idea = path.join(root, 'idea.md');
writeFileSync(idea, '# Idea\n');
afterAll(() => rmSync(root, { recursive: true, force: true }));

const Doc = z.object({ title: z.string() });
type Doc = z.infer<typeof Doc>;
const clean: Review = { checked: [], blockers: [], replies: [] };

/** A draft without a title, a clean review, then a fix that adds it. */
const fakeLlm = () => {
  const outputs: unknown[] = [{ title: '' }, clean, { title: 'Cats', replies: [] }, clean];
  const stages: string[] = [];
  const llm: Llm = {
    async generateStructured(input: GenerateInput<unknown>) {
      stages.push(input.stage);
      const data = outputs[stages.length - 1];
      return {
        data: data as never,
        raw: JSON.stringify(data),
        usage: { input: 10, cachedInput: 0, output: 5 },
        costUsd: 0.001,
        replayed: false,
        model: 'claude-sonnet-5-5',
        durationMs: 1,
      };
    },
  };
  return { llm, stages };
};

const options = (id: string, llm: Llm): SpecStageOptions<Doc> => ({
  run: createRun({ idea, runsDir: root, id }),
  llm,
  stage: 'doc',
  schema: Doc,
  schemaName: 'Doc',
  system: 'Write a doc.',
  user: 'About cats.',
  validate: (doc) => (doc.title ? [] : [{ rule: 'DOC-001', severity: 'mandatory', message: 'title must not be empty' }]),
  review: { output: 'Look for: a title that says nothing.' },
});

describe('logicalRunner', () => {
  it('returns what runSpecStage returns, with the same calls', async () => {
    const logical = fakeLlm();
    const direct = fakeLlm();

    const result = await logicalRunner(options('logical', logical.llm));

    expect(result).toEqual(await runSpecStage(options('direct', direct.llm)));
    expect(result.output).toEqual({ title: 'Cats' });
    expect(logical.stages).toEqual(direct.stages);
  });
});
