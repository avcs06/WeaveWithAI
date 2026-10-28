import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import OpenAI from 'openai';
import type { z } from 'zod';
import type { Config } from './env';
import { costUsd, type Usage } from './prices';
import { toJsonSchema } from './schema';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type ModelChoice = 'default' | 'strong';

export type GenerateInput<T> = {
  stage: string;
  round: number;
  schema: z.ZodType<T>;
  schemaName: string;
  messages: ChatMessage[];
  model?: ModelChoice;
  maxTokens?: number;
  /** When given, the call is written to `<runDir>/llm/<stage>-r<round>.json`. */
  runDir?: string;
};

export type GenerateResult<T> = {
  data: T;
  raw: string;
  usage: Usage;
  costUsd: number;
  replayed: boolean;
  backend: string;
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

export class ModelOutputTruncated extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelOutputTruncated';
  }
}

export class ModelOutputInvalid extends Error {
  constructor(
    message: string,
    public issues: unknown,
  ) {
    super(message);
    this.name = 'ModelOutputInvalid';
  }
}

/** The one SDK method this module calls. A plain async function satisfies it, so tests need no cast. */
export type ChatClient = {
  create(body: OpenAI.ChatCompletionCreateParamsNonStreaming): Promise<OpenAI.ChatCompletion>;
};

export type LlmDeps = {
  config: Config;
  client?: ChatClient;
  replayDir?: string;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

export type Llm = {
  generateStructured<T>(input: GenerateInput<T>): Promise<GenerateResult<T>>;
};

const BACKEND = 'meta';
const TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 8192;
const MAX_OUTPUT_TOKENS = 16_384;
const MAX_ATTEMPTS = 5;
const MAX_BACKOFF_MS = 30_000;
const JITTER_MS = 250;

type Request = {
  backend: string;
  model: string;
  messages: ChatMessage[];
  schemaName: string;
  schema: Record<string, unknown>;
};

type Completed = { content: string; finishReason: string; usage: Usage };
type ReplayRecord = Completed & { request: Request; createdAt: string };

export function createLlm(deps: LlmDeps): Llm {
  const { config } = deps;
  const replayDir = deps.replayDir ?? '.weave-cache/replay';
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = deps.now ?? Date.now;
  let client = deps.client;

  const getClient = (): ChatClient =>
    (client ??= new OpenAI({
      apiKey: config.MODEL_API_KEY,
      baseURL: config.LLM_BASE_URL,
      maxRetries: 0,
    }).chat.completions);

  async function generateStructured<T>(input: GenerateInput<T>): Promise<GenerateResult<T>> {
    const started = now();
    const model = input.model === 'strong' ? config.LLM_MODEL_STRONG : config.LLM_MODEL;
    const bridged = toJsonSchema(input.schema, input.schemaName);
    const request: Request = {
      backend: BACKEND,
      model,
      messages: input.messages,
      schemaName: input.schemaName,
      schema: bridged.schema,
    };
    const key = sha256(canonicalJson({ backend: BACKEND, model, messages: input.messages, schema: bridged.schema }));
    const replayFile = path.join(replayDir, `${key}.json`);

    let record = config.LLM_REPLAY ? await readJson<ReplayRecord>(replayFile) : undefined;
    const replayed = record !== undefined;
    if (!record) {
      const completed = await requestUntilComplete(request, input.maxTokens ?? DEFAULT_MAX_TOKENS);
      record = { ...completed, request, createdAt: new Date(now()).toISOString() };
      await writeJson(replayFile, record);
    }

    const data = parseContent(input.schema, record.content);
    const result: GenerateResult<T> = {
      data,
      raw: record.content,
      usage: record.usage,
      costUsd: replayed ? 0 : costUsd(model, record.usage),
      replayed,
      backend: BACKEND,
      model,
      durationMs: now() - started,
    };

    if (input.runDir) {
      await writeJson(path.join(input.runDir, 'llm', `${input.stage}-r${input.round}.json`), {
        request: { model, messages: input.messages, schemaName: input.schemaName },
        response: record.content,
        usage: record.usage,
        costUsd: result.costUsd,
        replayed,
        durationMs: result.durationMs,
      });
    }
    return result;
  }

  /** One request, plus a single retry with a larger output limit when the answer was cut short. */
  async function requestUntilComplete(request: Request, maxTokens: number): Promise<Completed> {
    let limit = maxTokens;
    for (let grown = false; ; grown = true) {
      const completion = await requestWithRetries({
        model: request.model,
        messages: request.messages,
        temperature: TEMPERATURE,
        max_tokens: limit,
        response_format: {
          type: 'json_schema',
          json_schema: { name: request.schemaName, schema: request.schema },
        },
      });
      const choice = completion.choices[0];
      if (!choice) throw new ModelOutputInvalid(`${request.model} returned no choices`, []);

      if (choice.finish_reason === 'length') {
        const larger = Math.min(MAX_OUTPUT_TOKENS, limit * 2);
        if (grown || larger === limit) {
          throw new ModelOutputTruncated(`${request.model} output was cut at ${limit} tokens`);
        }
        limit = larger;
        continue;
      }

      const content = choice.message.content;
      if (content === null) {
        throw new ModelOutputInvalid(`${request.model} returned no content (${choice.finish_reason})`, []);
      }
      const usage = completion.usage;
      return {
        content,
        finishReason: choice.finish_reason,
        usage: {
          input: usage?.prompt_tokens ?? 0,
          cachedInput: usage?.prompt_tokens_details?.cached_tokens ?? 0,
          output: usage?.completion_tokens ?? 0,
        },
      };
    }
  }

  async function requestWithRetries(
    body: OpenAI.ChatCompletionCreateParamsNonStreaming,
  ): Promise<OpenAI.ChatCompletion> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await getClient().create(body);
      } catch (error) {
        if (!(error instanceof OpenAI.APIError)) throw error;
        const { status } = error;
        const retryable =
          error instanceof OpenAI.APIConnectionError ||
          status === 429 ||
          (status !== undefined && status >= 500 && status < 600);
        if (!retryable) throw new ModelRequestFailed(`${body.model}: ${error.message}`, status);
        if (attempt + 1 >= MAX_ATTEMPTS) {
          throw new ModelRequestFailed(
            `${body.model}: ${error.message} (gave up after ${MAX_ATTEMPTS} attempts)`,
            status,
          );
        }
        await sleep(retryDelayMs(error.headers?.get('retry-after'), attempt, now()));
      }
    }
  }

  return { generateStructured };
}

/** `Retry-After` wins when present (seconds or an HTTP date); otherwise capped exponential backoff with jitter. */
function retryDelayMs(retryAfter: string | null | undefined, attempt: number, nowMs: number): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const at = Date.parse(retryAfter);
    if (!Number.isNaN(at)) return Math.max(0, at - nowMs);
  }
  return Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt) + Math.random() * JITTER_MS;
}

function parseContent<T>(schema: z.ZodType<T>, content: string): T {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw new ModelOutputInvalid(`output is not JSON: ${(error as Error).message}`, []);
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const summary = parsed.error.issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    throw new ModelOutputInvalid(`output does not match the schema: ${summary}`, parsed.error.issues);
  }
  return parsed.data;
}

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

// Step 05 moves the canonical JSON helper to artifacts.ts.
function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, sortKeys(record[key])]),
  );
}
