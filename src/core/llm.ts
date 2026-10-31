import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import OpenAI from 'openai';
import type { z } from 'zod';
import { type Backend, resolveBackend } from './backends';
import type { Config } from './env';
import { costUsd, type Usage } from './prices';
import { toJsonSchema } from './schema';
import { canonicalJson, sha256, writeJsonAtomic } from './utils';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
export type ModelChoice = 'default' | 'strong';
/** Meta's `reasoning_effort`; omitted, the model picks its own level. Reasoning tokens count toward max_tokens. */
export type ReasoningEffort =
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high'
  | 'xhigh'
  | 'max';
/** Two modes (user, 2026-10-30): 0.2 for exact values, 0.7 for the calls that set a direction. */
export type Temperature = 0.2 | 0.7;

export type GenerateInput<T> = {
  stage: string;
  round: number;
  schema: z.ZodType<T>;
  schemaName: string;
  messages: ChatMessage[];
  model?: ModelChoice;
  maxTokens?: number;
  /** Default 0.2; part of the replay key. */
  temperature?: Temperature;
  /** Omitted by default; part of the replay key. A strong call without a strong model steps it up. */
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
  create(
    body: OpenAI.ChatCompletionCreateParamsNonStreaming,
  ): Promise<OpenAI.ChatCompletion>;
};

export type LlmDeps = {
  config: Config;
  /** Defaults to the backend LLM_BACKEND names. */
  backend?: Backend;
  client?: ChatClient;
  replayDir?: string;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

export type Llm = {
  generateStructured<T>(input: GenerateInput<T>): Promise<GenerateResult<T>>;
};

const TEMPERATURE = 0.2;
// D1.8: a backend whose strong model is missing or the base model escalates by effort instead, never to max.
const STEP_UP: Partial<Record<ReasoningEffort, ReasoningEffort>> = {
  medium: 'high',
  high: 'xhigh',
};
const DEFAULT_MAX_TOKENS = 8192;
const MAX_OUTPUT_TOKENS = 65_536;
const MAX_ATTEMPTS = 5;
const MAX_BACKOFF_MS = 30_000;
// A server asking for a longer wait is treated as down; the run fails and says so.
const MAX_RETRY_AFTER_MS = 60_000;
const JITTER_MS = 250;

type Request = {
  backend: string;
  model: string;
  messages: ChatMessage[];
  temperature: number;
  reasoningEffort?: ReasoningEffort;
  schemaName: string;
  schema: Record<string, unknown>;
};

type Completed = { content: string; finishReason: string; usage: Usage };
type ReplayRecord = Completed & { request: Request; createdAt: string };

export function createLlm(deps: LlmDeps): Llm {
  const { config } = deps;
  const backend = deps.backend ?? resolveBackend(config);
  const replayDir = deps.replayDir ?? '.weave-cache/replay';
  const sleep =
    deps.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = deps.now ?? Date.now;
  let client = deps.client;

  const getClient = (): ChatClient =>
    (client ??= new OpenAI({
      apiKey: backend.apiKey,
      baseURL: backend.baseURL,
      maxRetries: 0,
    }).chat.completions);

  async function generateStructured<T>(
    input: GenerateInput<T>,
  ): Promise<GenerateResult<T>> {
    const started = now();
    const hasStrong =
      !!backend.strongModel && backend.strongModel !== backend.model;
    const strong = input.model === 'strong';
    const model = strong && hasStrong ? backend.strongModel : backend.model;
    const reasoningEffort =
      strong && !hasStrong && input.reasoningEffort
        ? (STEP_UP[input.reasoningEffort] ?? input.reasoningEffort)
        : input.reasoningEffort;
    const bridged = toJsonSchema(input.schema, input.schemaName);
    const request: Request = {
      backend: backend.name,
      model,
      messages: input.messages,
      temperature: input.temperature ?? TEMPERATURE,
      ...(reasoningEffort ? { reasoningEffort } : {}),
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
          input.maxTokens ?? DEFAULT_MAX_TOKENS,
        );
      } catch (error) {
        if (error instanceof ModelOutputTruncated && input.runDir)
          writeCut(input, model, error);
        throw error;
      }
      record = {
        ...completed,
        request,
        createdAt: new Date(now()).toISOString(),
      };
      writeJsonAtomic(replayFile, record);
    }

    const data = parseContent(input.schema, record.content);
    const result: GenerateResult<T> = {
      data,
      raw: record.content,
      usage: record.usage,
      costUsd: replayed ? 0 : costUsd(model, record.usage),
      replayed,
      backend: backend.name,
      model,
      durationMs: now() - started,
    };

    if (input.runDir) {
      writeJsonAtomic(
        path.join(input.runDir, 'llm', `${input.stage}-r${input.round}.json`),
        {
          request: {
            backend: backend.name,
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
    model: string,
    error: ModelOutputTruncated,
  ): void {
    const dir = path.join(input.runDir ?? '', 'llm');
    const name = (n: number) =>
      path.join(dir, `${input.stage}-r${input.round}-cut${n > 1 ? `-${n}` : ''}.json`);
    let n = 1;
    while (existsSync(name(n))) n += 1;
    writeJsonAtomic(name(n), {
      request: {
        backend: backend.name,
        model,
        messages: input.messages,
        schemaName: input.schemaName,
      },
      error: error.message,
      response: error.content,
      usage: error.usage,
      costUsd: costUsd(model, error.usage),
    });
  }

  /** One request, plus a single retry with a larger output limit when the answer was cut short. */
  async function requestUntilComplete(
    request: Request,
    maxTokens: number,
  ): Promise<Completed> {
    let limit = maxTokens;
    const cut: Usage = { input: 0, cachedInput: 0, output: 0 };
    for (let grown = false; ; grown = true) {
      const completion = await requestWithRetries({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        ...(request.reasoningEffort
          ? { reasoning_effort: request.reasoningEffort }
          : {}),
        max_tokens: limit,
        response_format: {
          type: 'json_schema',
          json_schema: { name: request.schemaName, schema: request.schema },
        },
      });
      const choice = completion.choices[0];
      if (!choice)
        throw new ModelOutputInvalid(
          `${request.model} returned no choices`,
          [],
        );

      if (choice.finish_reason === 'length') {
        cut.input += completion.usage?.prompt_tokens ?? 0;
        cut.cachedInput +=
          completion.usage?.prompt_tokens_details?.cached_tokens ?? 0;
        cut.output += completion.usage?.completion_tokens ?? 0;
        const larger = Math.min(MAX_OUTPUT_TOKENS, limit * 2);
        if (grown || larger === limit) {
          throw new ModelOutputTruncated(
            `${request.model} output was cut at ${limit} tokens (visible JSON so far: ${choice.message.content?.length ?? 0} characters, ${completion.usage?.completion_tokens ?? 0} output tokens including reasoning)`,
            request.model,
            cut,
            choice.message.content?.length ?? 0,
            choice.message.content ?? '',
          );
        }
        limit = larger;
        continue;
      }

      const content = choice.message.content;
      if (content === null) {
        throw new ModelOutputInvalid(
          `${request.model} returned no content (${choice.finish_reason})`,
          [],
        );
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
    const first = now();
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
        if (!retryable)
          throw new ModelRequestFailed(
            `${body.model}: ${error.message}`,
            status,
          );
        const coldStart =
          status === 503 && now() - first < (backend.coldStartMs ?? 0);
        if (attempt + 1 >= MAX_ATTEMPTS && !coldStart) {
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
