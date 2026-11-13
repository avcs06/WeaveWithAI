import { existsSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';
import type { Config } from './env';
import { costUsd, type Usage } from './prices';
import { toJsonSchema } from './schema';
import { canonicalJson, sha256, writeJsonAtomic } from './utils';

type Params = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming;
type Message = Anthropic.Beta.Messages.BetaMessage;

/** A PNG on disk, such as a screen's screenshot, with the line that names it for the model. */
export type ImageInput = { label: string; file: string };

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  /** Sent after the text, each under its label; user messages only. */
  images?: ImageInput[];
};
export type ModelChoice = 'default' | 'strong';
/** Claude's `output_config.effort`; omitted, the model's own default. Thinking tokens count toward max_tokens. */
export type ReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export type GenerateInput<T> = {
  stage: string;
  round: number;
  schema: z.ZodType<T>;
  schemaName: string;
  messages: ChatMessage[];
  model?: ModelChoice;
  maxTokens?: number;
  /** Omitted by default; part of the replay key. */
  reasoningEffort?: ReasoningEffort;
  /** When given, the call is written to `<runDir>/llm/<stage>-r<round>.json`. */
  runDir?: string;
};

export type GenerateResult<T> = {
  data: T;
  raw: string;
  usage: Usage;
  costUsd: number;
  replayed: boolean;
  model: string;
  durationMs: number;
};

export class ModelRequestFailed extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = 'ModelRequestFailed';
  }
}

/** Carries what the cut attempts cost and the visible JSON of the last one, so a run can account for them and show what was written. */
export class ModelOutputTruncated extends Error {
  constructor(
    message: string,
    public model: string,
    public usage: Usage,
    public contentLength: number,
    public content = '',
  ) {
    super(message);
    this.name = 'ModelOutputTruncated';
  }
}

export class ModelOutputInvalid extends Error {
  /** The model and the tokens of an answer the model gave but the schema refused, so its cost is logged. */
  public paid?: { model: string; usage: Usage };
  constructor(
    message: string,
    public issues: unknown,
  ) {
    super(message);
    this.name = 'ModelOutputInvalid';
  }
}

/** The one SDK call this module makes. A plain async function satisfies it, so tests need no cast. */
export type MessagesClient = {
  create(body: Params): Promise<Message>;
};

export type LlmDeps = {
  config: Config;
  client?: MessagesClient;
  replayDir?: string;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

export type Llm = {
  generateStructured<T>(input: GenerateInput<T>): Promise<GenerateResult<T>>;
};

// A refusal is answered again on the model the API picks for its category, inside the same call.
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
const DEFAULT_MAX_TOKENS = 8192;
const MAX_OUTPUT_TOKENS = 98_304;
const MAX_ATTEMPTS = 5;
const MAX_BACKOFF_MS = 30_000;
// A server asking for a longer wait is treated as down; the run fails and says so.
const MAX_RETRY_AFTER_MS = 60_000;
const JITTER_MS = 250;

/** A message as the replay key holds it: an image by the hash of its bytes, so a moved file still replays. */
type KeyedMessage = { role: ChatMessage['role']; content: string; images?: { label: string; sha256: string }[] };

type Request = {
  model: string;
  messages: KeyedMessage[];
  reasoningEffort?: ReasoningEffort;
  schemaName: string;
  schema: Record<string, unknown>;
};

/** `model` is the one that answered, which differs from the request's after a refusal fallback. */
type Completed = { content: string; finishReason: string; model: string; usage: Usage };
type ReplayRecord = Completed & { request: Request; createdAt: string };

export function createLlm(deps: LlmDeps): Llm {
  const { config } = deps;
  const replayDir = deps.replayDir ?? '.weave-cache/replay';
  const sleep =
    deps.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = deps.now ?? Date.now;
  let client = deps.client;

  // Streamed, since a long answer at a high max_tokens outlasts the SDK's timeout for one plain request.
  const getClient = (): MessagesClient => {
    if (client) return client;
    const sdk = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY, maxRetries: 0 });
    client = { create: (body) => sdk.beta.messages.stream(body).finalMessage() };
    return client;
  };

  async function generateStructured<T>(
    input: GenerateInput<T>,
  ): Promise<GenerateResult<T>> {
    const started = now();
    const requested = input.model === 'strong' ? config.LLM_MODEL_STRONG : config.LLM_MODEL;
    const bridged = toJsonSchema(input.schema, input.schemaName);
    const images = new Map<string, Buffer>();
    const messages = await Promise.all(
      input.messages.map(async ({ role, content, images: attached }): Promise<KeyedMessage> => {
        if (!attached?.length) return { role, content };
        const keyed = await Promise.all(
          attached.map(async ({ label, file }) => {
            const bytes = await readFile(file);
            const hash = sha256(bytes);
            images.set(hash, bytes);
            return { label, sha256: hash };
          }),
        );
        return { role, content, images: keyed };
      }),
    );
    const request: Request = {
      model: requested,
      messages,
      ...(input.reasoningEffort ? { reasoningEffort: input.reasoningEffort } : {}),
      schemaName: input.schemaName,
      schema: bridged.schema,
    };
    const key = sha256(canonicalJson(request));
    const replayFile = path.join(replayDir, `${key}.json`);

    let record = config.LLM_REPLAY
      ? await readReplay(replayFile)
      : undefined;
    const replayed = record !== undefined;
    if (!record) {
      let completed: Completed;
      try {
        completed = await requestUntilComplete(
          request,
          images,
          input.maxTokens ?? DEFAULT_MAX_TOKENS,
        );
      } catch (error) {
        if (error instanceof ModelOutputTruncated && input.runDir)
          writeCut(input, error);
        throw error;
      }
      record = {
        ...completed,
        request,
        createdAt: new Date(now()).toISOString(),
      };
    }
    const { model } = record;

    // Only an answer the schema takes is cached, so a retry asks the model again.
    let data: T;
    try {
      if (record.finishReason === 'refusal')
        throw new ModelOutputInvalid(`${model} declined to answer`, []);
      data = parseContent(input.schema, record.content);
    } catch (error) {
      if (!(error instanceof ModelOutputInvalid)) throw error;
      if (replayed) rmSync(replayFile, { force: true });
      else error.paid = { model, usage: record.usage };
      if (input.runDir) writeInvalid(input, model, record.content, error);
      throw error;
    }
    if (!replayed) writeJsonAtomic(replayFile, record);
    const result: GenerateResult<T> = {
      data,
      raw: record.content,
      usage: record.usage,
      costUsd: replayed ? 0 : costUsd(model, record.usage),
      replayed,
      model,
      durationMs: now() - started,
    };

    if (input.runDir) {
      writeJsonAtomic(
        path.join(input.runDir, 'llm', `${input.stage}-r${input.round}.json`),
        {
          request: {
            model,
            messages: input.messages,
            schemaName: input.schemaName,
          },
          response: record.content,
          usage: record.usage,
          costUsd: result.costUsd,
          replayed,
          durationMs: result.durationMs,
        },
      );
    }
    return result;
  }

  /** A cut answer as far as it got, in `<runDir>/llm/<stage>-r<round>-cut.json`, so a runaway can be read; a second cut in the round gets `-cut-2`. */
  function writeCut(
    input: GenerateInput<unknown>,
    error: ModelOutputTruncated,
  ): void {
    const dir = path.join(input.runDir ?? '', 'llm');
    const name = (n: number) =>
      path.join(dir, `${input.stage}-r${input.round}-cut${n > 1 ? `-${n}` : ''}.json`);
    let n = 1;
    while (existsSync(name(n))) n += 1;
    writeJsonAtomic(name(n), {
      request: {
        model: error.model,
        messages: input.messages,
        schemaName: input.schemaName,
      },
      error: error.message,
      response: error.content,
      usage: error.usage,
      costUsd: costUsd(error.model, error.usage),
    });
  }

  /** An answer the schema refused, in `<runDir>/llm/<stage>-r<round>-invalid.json`, so it can be read; a second in the round gets `-invalid-2`. */
  function writeInvalid(
    input: GenerateInput<unknown>,
    model: string,
    content: string,
    error: ModelOutputInvalid,
  ): void {
    const dir = path.join(input.runDir ?? '', 'llm');
    const name = (n: number) =>
      path.join(dir, `${input.stage}-r${input.round}-invalid${n > 1 ? `-${n}` : ''}.json`);
    let n = 1;
    while (existsSync(name(n))) n += 1;
    writeJsonAtomic(name(n), {
      request: { model, messages: input.messages, schemaName: input.schemaName },
      error: error.message,
      response: content,
    });
  }

  /** One request, plus a single retry with a larger output limit when the answer was cut short. */
  async function requestUntilComplete(
    request: Request,
    images: Map<string, Buffer>,
    maxTokens: number,
  ): Promise<Completed> {
    let limit = maxTokens;
    const cut: Usage = { input: 0, cachedInput: 0, output: 0 };
    for (let grown = false; ; grown = true) {
      const message = await requestWithRetries({
        model: request.model,
        max_tokens: limit,
        ...toWire(request.messages, images),
        output_config: {
          format: { type: 'json_schema', schema: request.schema },
          ...(request.reasoningEffort ? { effort: request.reasoningEffort } : {}),
        },
        betas: [FALLBACK_BETA],
        fallbacks: 'default',
      });
      const content = message.content
        .flatMap((block) => (block.type === 'text' ? [block.text] : []))
        .join('');
      const usage = usageOf(message.usage);

      if (message.stop_reason === 'max_tokens') {
        cut.input += usage.input;
        cut.cachedInput += usage.cachedInput;
        cut.output += usage.output;
        const larger = Math.min(MAX_OUTPUT_TOKENS, limit * 2);
        if (grown || larger === limit) {
          throw new ModelOutputTruncated(
            `${message.model} output was cut at ${limit} tokens (visible JSON so far: ${content.length} characters, ${usage.output} output tokens including thinking)`,
            message.model,
            cut,
            content.length,
            content,
          );
        }
        limit = larger;
        continue;
      }
      return { content, finishReason: message.stop_reason ?? '', model: message.model, usage };
    }
  }

  async function requestWithRetries(body: Params): Promise<Message> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await getClient().create(body);
      } catch (error) {
        if (!(error instanceof Anthropic.APIError)) throw error;
        const { status } = error;
        const retryable =
          error instanceof Anthropic.APIConnectionError ||
          status === 429 ||
          (status !== undefined && status >= 500 && status < 600);
        if (!retryable)
          throw new ModelRequestFailed(
            `${body.model}: ${error.message}`,
            status,
          );
        if (attempt + 1 >= MAX_ATTEMPTS) {
          throw new ModelRequestFailed(
            `${body.model}: ${error.message} (gave up after ${attempt + 1} attempts)`,
            status,
          );
        }
        await sleep(retryDelayMs(error.headers, attempt, now()));
      }
    }
  }

  return { generateStructured };
}

/** Token counts with `input` including the cache reads and writes, as `Usage` counts them. */
function usageOf(usage: Anthropic.Beta.Messages.BetaUsage): Usage {
  const read = usage.cache_read_input_tokens ?? 0;
  const written = usage.cache_creation_input_tokens ?? 0;
  return { input: usage.input_tokens + read + written, cachedInput: read, output: usage.output_tokens };
}

/** The request's system prompt and turns: each image after the text, under its label, as base64. */
function toWire(
  messages: KeyedMessage[],
  images: Map<string, Buffer>,
): Pick<Params, 'system' | 'messages'> {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const turns = messages.flatMap(({ role, content, images: attached }): Anthropic.Beta.Messages.BetaMessageParam[] => {
    if (role === 'system') return [];
    if (!attached?.length) return [{ role, content }];
    const blocks: Anthropic.Beta.Messages.BetaContentBlockParam[] = [{ type: 'text', text: content }];
    for (const { label, sha256: hash } of attached)
      blocks.push(
        { type: 'text', text: label },
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: images.get(hash)?.toString('base64') ?? '' } },
      );
    return [{ role: 'user', content: blocks }];
  });
  return { ...(system ? { system } : {}), messages: turns };
}

/**
 * `retry-after-ms`, then `Retry-After` (seconds or an HTTP date), capped at a
 * minute; otherwise capped exponential backoff with jitter.
 */
function retryDelayMs(
  headers: Headers | undefined,
  attempt: number,
  nowMs: number,
): number {
  const capped = (ms: number) => Math.min(MAX_RETRY_AFTER_MS, Math.max(0, ms));
  const ms = Number(headers?.get('retry-after-ms') ?? Number.NaN);
  if (Number.isFinite(ms)) return capped(ms);
  const retryAfter = headers?.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return capped(seconds * 1000);
    const at = Date.parse(retryAfter);
    if (!Number.isNaN(at)) return capped(at - nowMs);
  }
  return (
    Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt) + Math.random() * JITTER_MS
  );
}

function parseContent<T>(schema: z.ZodType<T>, content: string): T {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw new ModelOutputInvalid(
      `output is not JSON: ${(error as Error).message}`,
      [],
    );
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const summary = parsed.error.issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    throw new ModelOutputInvalid(
      `output does not match the schema: ${summary}`,
      parsed.error.issues,
    );
  }
  return parsed.data;
}

/** A cached answer; a file that is not JSON fails the call instead of paying for it again unseen. */
async function readReplay(file: string): Promise<ReplayRecord | undefined> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
  try {
    return JSON.parse(text) as ReplayRecord;
  } catch {
    throw new Error(
      `replay file ${file} is not valid JSON; delete it to call the model again`,
    );
  }
}
