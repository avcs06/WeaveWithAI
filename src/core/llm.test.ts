import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { Config } from './env';
import {
  createLlm,
  type GenerateInput,
  type LlmDeps,
  type MessagesClient,
  ModelOutputInvalid,
  ModelOutputTruncated,
  ModelRequestFailed,
} from './llm';

type Message = Anthropic.Beta.Messages.BetaMessage;
type Body = Parameters<MessagesClient['create']>[0];

// Built by hand: the tests never read the repo's .env.
const config: Config = {
  ANTHROPIC_API_KEY: 'test-key',
  LLM_MODEL: 'claude-sonnet-5-5',
  LLM_MODEL_STRONG: 'claude-opus-5-5',
  LLM_REPLAY: false,
  CLAUDE_BIN: 'claude',
  CLAUDE_DOCKER: false,
  CLAUDE_AUTH: 'api',
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

/** An answer as the API gives it: an empty thinking block, then the text; 80 fresh, 20 cached and 50 out. */
function message(
  text: string,
  stop_reason: 'end_turn' | 'max_tokens' | 'refusal' = 'end_turn',
  model = 'claude-sonnet-5-5',
): Message {
  return {
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model,
    content: [
      { type: 'thinking', thinking: '', signature: 'sig' },
      { type: 'text', text, citations: null },
    ],
    stop_reason,
    stop_sequence: null,
    usage: { input_tokens: 80, cache_read_input_tokens: 20, cache_creation_input_tokens: 0, output_tokens: 50 },
  } as unknown as Message;
}

function apiError(
  status: number,
  message: string,
  headers: Record<string, string> = {},
) {
  return new Anthropic.APIError(status, { message }, message, new Headers(headers));
}

/** An llm whose client pops scripted results, plus the requests and sleeps it made. */
function harness(
  script: Array<Message | Error>,
  cfg: Config = config,
  extra: Partial<LlmDeps> = {},
) {
  const calls: Body[] = [];
  const sleeps: number[] = [];
  const client: MessagesClient = {
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
    ...extra,
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
  it('parses the answer, reports usage and prices it at the default model\'s rates', async () => {
    const runDir = tmp();
    const { llm, calls } = harness([message('{"title":"Weave"}')]);
    const result = await llm.generateStructured({ ...input(), runDir });

    expect(result.data).toEqual({ title: 'Weave' });
    expect(result.usage).toEqual({ input: 100, cachedInput: 20, output: 50 });
    // 80 × 2 + 20 × 0.2 + 50 × 10 = 664 per 1M tokens.
    expect(result.costUsd).toBeCloseTo(0.000664, 12);
    expect(result).toMatchObject({ replayed: false, model: 'claude-sonnet-5-5' });
    expect(calls[0]).toMatchObject({
      model: 'claude-sonnet-5-5',
      max_tokens: 8192,
      messages: [{ role: 'user', content: 'Name the doc' }],
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    expect(calls[0]).not.toHaveProperty('temperature');
    expect(calls[0]).not.toHaveProperty('system');

    const audit = readFileSync(
      path.join(runDir, 'llm', 'flows-r1.json'),
      'utf8',
    );
    expect(JSON.parse(audit)).toMatchObject({
      request: { model: 'claude-sonnet-5-5', schemaName: 'doc' },
      response: '{"title":"Weave"}',
      usage: result.usage,
      costUsd: result.costUsd,
      replayed: false,
    });
    expect(audit).not.toContain('test-key');
  });

  it('asks for the schema as structured output', async () => {
    const { llm, calls } = harness([message('{"title":"Weave"}')]);
    await llm.generateStructured(input());
    expect(calls[0]?.output_config).toEqual({
      format: {
        type: 'json_schema',
        schema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'], additionalProperties: false },
      },
    });
  });

  it('sends the system messages as the system prompt', async () => {
    const { llm, calls } = harness([message('{"title":"Weave"}')]);
    await llm.generateStructured({
      ...input(),
      messages: [
        { role: 'system', content: 'You name docs.' },
        { role: 'user', content: 'Name the doc' },
        { role: 'assistant', content: '{"title":"W"}' },
        { role: 'user', content: 'Longer.' },
      ],
    });
    expect(calls[0]?.system).toBe('You name docs.');
    expect(calls[0]?.messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
  });

  it('waits for Retry-After on a 429, then succeeds', async () => {
    const { llm, calls, sleeps } = harness([
      apiError(429, 'rate limited', { 'retry-after': '0' }),
      message('{"title":"Weave"}'),
    ]);
    const result = await llm.generateStructured(input());

    expect(result.data).toEqual({ title: 'Weave' });
    expect(calls).toHaveLength(2);
    expect(sleeps).toEqual([0]);
  });

  it('reads retry-after-ms first and caps any server wait at a minute', async () => {
    const { llm, sleeps } = harness([
      apiError(429, 'rate limited', {
        'retry-after-ms': '1500',
        'retry-after': '9',
      }),
      apiError(529, 'overloaded', { 'retry-after': '3600' }),
      message('{"title":"Weave"}'),
    ]);
    await llm.generateStructured(input());
    expect(sleeps).toEqual([1500, 60_000]);
  });

  it('gives up on a server error after 5 attempts', async () => {
    const { llm, calls } = harness(Array.from({ length: 6 }, () => apiError(503, 'unavailable')));
    await expect(llm.generateStructured(input())).rejects.toThrow('gave up after 5 attempts');
    expect(calls).toHaveLength(5);
  });

  it('fails loudly on a replay file that is not JSON, naming it', async () => {
    const replayDir = tmp();
    const first = harness(
      [message('{"title":"Weave"}')],
      { ...config, LLM_REPLAY: true },
      { replayDir },
    );
    await first.llm.generateStructured(input());
    const [file] = readdirSync(replayDir);
    writeFileSync(path.join(replayDir, file!), '{"content": "cut');
    const second = harness([], { ...config, LLM_REPLAY: true }, { replayDir });
    await expect(second.llm.generateStructured(input())).rejects.toThrow(
      `replay file ${path.join(replayDir, file!)} is not valid JSON; delete it to call the model again`,
    );
  });

  it('sends each image after the text under its label as base64, and keys the replay by its bytes, not its path', async () => {
    const dir = tmp();
    const write = (name: string, bytes: string) => {
      writeFileSync(path.join(dir, name), bytes);
      return path.join(dir, name);
    };
    const withImage = (file: string) => ({
      ...input(),
      messages: [{ role: 'user' as const, content: 'Review the screens.', images: [{ label: 'S01 at /', file }] }],
    });
    const replayDir = tmp();
    const replaying = { ...config, LLM_REPLAY: true };
    const first = harness([message('{"title":"Weave"}')], replaying, { replayDir });
    await first.llm.generateStructured(withImage(write('a.png', 'png-1')));
    expect(first.calls[0]?.messages).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Review the screens.' },
          { type: 'text', text: 'S01 at /' },
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: Buffer.from('png-1').toString('base64') } },
        ],
      },
    ]);
    // The same bytes at another path replay; new bytes ask again.
    const second = harness([message('{"title":"Weave 2"}')], replaying, { replayDir });
    expect((await second.llm.generateStructured(withImage(write('b.png', 'png-1')))).replayed).toBe(true);
    expect((await second.llm.generateStructured(withImage(write('c.png', 'png-2')))).replayed).toBe(false);
    expect(second.calls).toHaveLength(1);
  });

  it('retries a truncated answer once with max_tokens doubled, capped at 98304', async () => {
    const doubled = harness([
      message('{"title":"We', 'max_tokens'),
      message('{"title":"Weave"}'),
    ]);
    await doubled.llm.generateStructured({ ...input(), maxTokens: 1000 });
    expect(doubled.calls.map((call) => call.max_tokens)).toEqual([1000, 2000]);

    const capped = harness([
      message('{"title":"We', 'max_tokens'),
      message('{"title":"Weave"}'),
    ]);
    await capped.llm.generateStructured({ ...input(), maxTokens: 60_000 });
    expect(capped.calls.map((call) => call.max_tokens)).toEqual([
      60_000, 98_304,
    ]);
  });

  it('throws ModelOutputTruncated when the answer is cut twice', async () => {
    const { llm, calls } = harness([
      message('{', 'max_tokens'),
      message('{"ti', 'max_tokens'),
    ]);
    const error: unknown = await llm
      .generateStructured(input())
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ModelOutputTruncated);
    // Both cut attempts were billed: 100 in and 50 out each from the fake usage.
    expect(error as ModelOutputTruncated).toMatchObject({
      model: 'claude-sonnet-5-5',
      usage: { input: 200, output: 100 },
      contentLength: 4,
      content: '{"ti',
    });
    expect(calls).toHaveLength(2);
  });

  it('keeps each cut answer in the run, a second cut in the round beside the first', async () => {
    const runDir = tmp();
    const { llm } = harness([
      message('{', 'max_tokens'),
      message('{"ti', 'max_tokens'),
      message('{', 'max_tokens'),
      message('{"tit', 'max_tokens'),
    ]);
    for (let i = 0; i < 2; i += 1)
      await llm.generateStructured({ ...input(), runDir }).catch(() => {});
    const cut = (file: string) =>
      JSON.parse(readFileSync(path.join(runDir, 'llm', file), 'utf8')) as {
        response: string;
        usage: { output: number };
        request: { model: string };
      };
    expect(readdirSync(path.join(runDir, 'llm')).sort()).toEqual([
      'flows-r1-cut-2.json',
      'flows-r1-cut.json',
    ]);
    expect(cut('flows-r1-cut.json')).toMatchObject({
      response: '{"ti',
      usage: { output: 100 },
      request: { model: 'claude-sonnet-5-5' },
    });
    expect(cut('flows-r1-cut-2.json').response).toBe('{"tit');
  });

  it('replays an identical request without a call when LLM_REPLAY is on', async () => {
    const script = [
      message('{"title":"Weave"}'),
      message('{"title":"Other"}'),
    ];
    const { llm, calls } = harness(script, { ...config, LLM_REPLAY: true });

    const first = await llm.generateStructured(input());
    const second = await llm.generateStructured(input());
    expect(calls).toHaveLength(1);
    expect(first.replayed).toBe(false);
    expect(second).toMatchObject({
      data: { title: 'Weave' },
      replayed: true,
      costUsd: 0,
      usage: first.usage,
    });

    const third = await llm.generateStructured(input('Name another doc'));
    expect(calls).toHaveLength(2);
    expect(third).toMatchObject({ data: { title: 'Other' }, replayed: false });
  });

  it('fails at once with the status on a 400', async () => {
    const { llm, calls, sleeps } = harness([apiError(400, 'bad request')]);
    const error: unknown = await llm
      .generateStructured(input())
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ModelRequestFailed);
    expect((error as ModelRequestFailed).status).toBe(400);
    expect(calls).toHaveLength(1);
    expect(sleeps).toEqual([]);
  });

  it('throws ModelOutputInvalid with the zod issues when the answer misses the schema', async () => {
    const { llm } = harness([message('{"wrong": 1}')]);
    const error: unknown = await llm
      .generateStructured(input())
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ModelOutputInvalid);
    expect((error as ModelOutputInvalid).issues).toEqual([
      expect.objectContaining({ path: ['title'] }),
    ]);
  });

  it('keeps an answer the schema refuses out of the replay cache and in the run, with what it cost, so a retry asks again', async () => {
    const runDir = tmp();
    const { llm, calls } = harness([message('Fixing the spacing now.'), message('{"title":"Weave"}')], {
      ...config,
      LLM_REPLAY: true,
    });
    const error: unknown = await llm.generateStructured({ ...input(), runDir }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ModelOutputInvalid);
    expect((error as ModelOutputInvalid).paid).toMatchObject({ model: 'claude-sonnet-5-5', usage: { output: 50 } });
    const saved = JSON.parse(readFileSync(path.join(runDir, 'llm', 'flows-r1-invalid.json'), 'utf8')) as { response: string };
    expect(saved.response).toBe('Fixing the spacing now.');
    const again = await llm.generateStructured({ ...input(), runDir });
    expect(calls).toHaveLength(2);
    expect(again).toMatchObject({ data: { title: 'Weave' }, replayed: false });
  });

  it('throws ModelOutputInvalid on a refusal, with what it cost, and keeps it out of the replay cache', async () => {
    const { llm, calls } = harness([message('', 'refusal'), message('{"title":"Weave"}')], { ...config, LLM_REPLAY: true });
    const error: unknown = await llm.generateStructured(input()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ModelOutputInvalid);
    expect((error as ModelOutputInvalid).message).toBe('claude-sonnet-5-5 declined to answer');
    expect((error as ModelOutputInvalid).paid).toMatchObject({ model: 'claude-sonnet-5-5', usage: { output: 50 } });
    expect((await llm.generateStructured(input())).replayed).toBe(false);
    expect(calls).toHaveLength(2);
  });

  it('names and prices the model that answered when a fallback took over', async () => {
    const { llm } = harness([message('{"title":"Weave"}', 'end_turn', 'claude-opus-5-5')]);
    const result = await llm.generateStructured(input());
    expect(result.model).toBe('claude-opus-5-5');
    // 80 × 4 + 20 × 0.2 + 50 × 20 = 1324 per 1M tokens.
    expect(result.costUsd).toBeCloseTo(0.001324, 12);
  });
});

describe('reasoning effort', () => {
  it('is sent only when given and changes the replay key', async () => {
    const replayDir = tmp();
    const replaying = { ...config, LLM_REPLAY: true };
    const { llm, calls } = harness(
      [message('{"title":"A"}'), message('{"title":"B"}')],
      replaying,
      { replayDir },
    );

    await llm.generateStructured(input());
    expect(
      (await llm.generateStructured({ ...input(), reasoningEffort: 'low' }))
        .data,
    ).toEqual({ title: 'B' });
    expect(calls.map((call) => call.output_config?.effort)).toEqual([undefined, 'low']);
    expect(
      (await llm.generateStructured({ ...input(), reasoningEffort: 'low' }))
        .replayed,
    ).toBe(true);
  });
});

describe('strong model', () => {
  it('uses the strong model at the same effort', async () => {
    const { llm, calls } = harness([
      message('{"title":"A"}'),
      message('{"title":"B"}', 'end_turn', 'claude-opus-5-5'),
    ]);

    await llm.generateStructured({ ...input(), reasoningEffort: 'medium' });
    await llm.generateStructured({
      ...input(),
      model: 'strong',
      reasoningEffort: 'medium',
    });
    expect(calls.map((call) => [call.model, call.output_config?.effort])).toEqual([
      ['claude-sonnet-5-5', 'medium'],
      ['claude-opus-5-5', 'medium'],
    ]);
  });
});
