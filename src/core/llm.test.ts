import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import OpenAI from 'openai';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { Config } from './env';
import {
  type ChatClient,
  createLlm,
  type GenerateInput,
  ModelOutputInvalid,
  ModelOutputTruncated,
  ModelRequestFailed,
} from './llm';

// Built by hand: the tests never read the repo's .env.
const config: Config = {
  MODEL_API_KEY: 'test-key',
  LLM_BASE_URL: 'https://api.meta.ai/v1',
  LLM_MODEL: 'muse-spark-1.3',
  LLM_MODEL_STRONG: 'muse-wonder-1.0',
  LLM_MODEL_VISION: 'muse-spark-1.3',
  LLM_REPLAY: false,
};

const Doc = z.object({ title: z.string() });

const dirs: string[] = [];
afterAll(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

function tmp(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'weave-llm-'));
  dirs.push(dir);
  return dir;
}

function completion(content: string, finish_reason: 'stop' | 'length' = 'stop'): OpenAI.ChatCompletion {
  return {
    id: 'chatcmpl-1',
    object: 'chat.completion',
    created: 0,
    model: 'muse-spark-1.3',
    choices: [{ index: 0, finish_reason, logprobs: null, message: { role: 'assistant', content, refusal: null } }],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
      prompt_tokens_details: { cached_tokens: 20 },
    },
  };
}

function apiError(status: number, message: string, headers: Record<string, string> = {}) {
  return new OpenAI.APIError(status, { message }, message, new Headers(headers));
}

/** An llm whose client pops scripted results, plus the requests and sleeps it made. */
function harness(script: Array<OpenAI.ChatCompletion | Error>, cfg: Config = config) {
  const calls: OpenAI.ChatCompletionCreateParamsNonStreaming[] = [];
  const sleeps: number[] = [];
  const client: ChatClient = {
    async create(body) {
      calls.push(body);
      const next = script.shift();
      if (next === undefined) throw new Error('script exhausted');
      if (next instanceof Error) throw next;
      return next;
    },
  };
  const llm = createLlm({
    config: cfg,
    client,
    replayDir: tmp(),
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  });
  return { llm, calls, sleeps };
}

function input(prompt = 'Name the doc'): GenerateInput<z.infer<typeof Doc>> {
  return {
    stage: 'flows',
    round: 1,
    schema: Doc,
    schemaName: 'doc',
    messages: [{ role: 'user', content: prompt }],
  };
}

describe('generateStructured', () => {
  it('parses the answer, reports usage and prices it at spark rates', async () => {
    const runDir = tmp();
    const { llm, calls } = harness([completion('{"title":"Weave"}')]);
    const result = await llm.generateStructured({ ...input(), runDir });

    expect(result.data).toEqual({ title: 'Weave' });
    expect(result.usage).toEqual({ input: 100, cachedInput: 20, output: 50 });
    // (100 - 20) × 1.25 + 20 × 0.15 + 50 × 4.25 = 315.5 per 1M tokens.
    expect(result.costUsd).toBeCloseTo(0.0003155, 12);
    expect(result).toMatchObject({ replayed: false, backend: 'meta', model: 'muse-spark-1.3' });
    expect(calls[0]).toMatchObject({
      model: 'muse-spark-1.3',
      temperature: 0.2,
      max_tokens: 8192,
      response_format: { type: 'json_schema', json_schema: { name: 'doc' } },
    });

    const audit = readFileSync(path.join(runDir, 'llm', 'flows-r1.json'), 'utf8');
    expect(JSON.parse(audit)).toMatchObject({
      request: { model: 'muse-spark-1.3', schemaName: 'doc' },
      response: '{"title":"Weave"}',
      usage: result.usage,
      costUsd: result.costUsd,
      replayed: false,
    });
    expect(audit).not.toContain('test-key');
  });

  it('waits for Retry-After on a 429, then succeeds', async () => {
    const { llm, calls, sleeps } = harness([
      apiError(429, 'rate limited', { 'retry-after': '0' }),
      completion('{"title":"Weave"}'),
    ]);
    const result = await llm.generateStructured(input());

    expect(result.data).toEqual({ title: 'Weave' });
    expect(calls).toHaveLength(2);
    expect(sleeps).toEqual([0]);
  });

  it('retries a truncated answer once with max_tokens doubled, capped at 16384', async () => {
    const doubled = harness([completion('{"title":"We', 'length'), completion('{"title":"Weave"}')]);
    await doubled.llm.generateStructured({ ...input(), maxTokens: 1000 });
    expect(doubled.calls.map((call) => call.max_tokens)).toEqual([1000, 2000]);

    const capped = harness([completion('{"title":"We', 'length'), completion('{"title":"Weave"}')]);
    await capped.llm.generateStructured({ ...input(), maxTokens: 10_000 });
    expect(capped.calls.map((call) => call.max_tokens)).toEqual([10_000, 16_384]);
  });

  it('throws ModelOutputTruncated when the answer is cut twice', async () => {
    const { llm, calls } = harness([completion('{', 'length'), completion('{"ti', 'length')]);
    await expect(llm.generateStructured(input())).rejects.toBeInstanceOf(ModelOutputTruncated);
    expect(calls).toHaveLength(2);
  });

  it('replays an identical request without a call when LLM_REPLAY is on', async () => {
    const script = [completion('{"title":"Weave"}'), completion('{"title":"Other"}')];
    const { llm, calls } = harness(script, { ...config, LLM_REPLAY: true });

    const first = await llm.generateStructured(input());
    const second = await llm.generateStructured(input());
    expect(calls).toHaveLength(1);
    expect(first.replayed).toBe(false);
    expect(second).toMatchObject({ data: { title: 'Weave' }, replayed: true, costUsd: 0, usage: first.usage });

    const third = await llm.generateStructured(input('Name another doc'));
    expect(calls).toHaveLength(2);
    expect(third).toMatchObject({ data: { title: 'Other' }, replayed: false });
  });

  it('fails at once with the status on a 400', async () => {
    const { llm, calls, sleeps } = harness([apiError(400, 'bad request')]);
    const error: unknown = await llm.generateStructured(input()).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ModelRequestFailed);
    expect((error as ModelRequestFailed).status).toBe(400);
    expect(calls).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });

  it('throws ModelOutputInvalid with the zod issues when the answer misses the schema', async () => {
    const { llm } = harness([completion('{"wrong": 1}')]);
    const error: unknown = await llm.generateStructured(input()).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ModelOutputInvalid);
    expect((error as ModelOutputInvalid).issues).toEqual([expect.objectContaining({ path: ['title'] })]);
  });
});
