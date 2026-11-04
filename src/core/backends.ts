import type { Config } from './env';

export type BackendName = 'meta' | 'modal' | 'baseten';
export type AgentName = 'muse' | 'opencode';
export type Backend = {
  name: BackendName;
  baseURL: string;
  apiKey: string;
  model: string;
  strongModel: string;
  /** The coding agent the code stages run. Baseten's Responses API drops Muse Code's tool calls, so Baseten runs OpenCode, on chat completions. */
  agent: AgentName;
  /** How long a 503 counts as a cold start and is retried past the usual attempts. */
  coldStartMs?: number;
};

// A scale-to-zero Modal endpoint answered 503 for about 4 minutes while it
// started; 5 minutes covers that with room.
const MODAL_COLD_START_MS = 300_000;

export const BACKEND_NAMES: readonly BackendName[] = [
  'meta',
  'modal',
  'baseten',
];

export function isBackendName(value: string): value is BackendName {
  return (BACKEND_NAMES as readonly string[]).includes(value);
}

export function resolveBackend(config: Config, override?: string): Backend {
  const name = override ?? config.LLM_BACKEND;
  if (!isBackendName(name))
    throw new Error(
      `Unknown backend ${name}; use one of ${BACKEND_NAMES.join(', ')}`,
    );
  switch (name) {
    case 'meta':
      return {
        name,
        baseURL: config.LLM_BASE_URL,
        apiKey: config.MODEL_API_KEY,
        model: config.LLM_MODEL,
        strongModel: config.LLM_MODEL_STRONG,
        agent: 'muse',
      };
    case 'modal': {
      const { MODAL_BASE_URL, MODAL_PROXY_TOKEN, MODAL_MODEL } = required(
        config,
        name,
        ['MODAL_BASE_URL', 'MODAL_PROXY_TOKEN', 'MODAL_MODEL'],
      );
      return {
        name,
        baseURL: MODAL_BASE_URL,
        apiKey: MODAL_PROXY_TOKEN,
        model: MODAL_MODEL,
        strongModel: MODAL_MODEL,
        agent: 'muse',
        coldStartMs: MODAL_COLD_START_MS,
      };
    }
    case 'baseten': {
      const { BASETEN_API_KEY, BASETEN_MODEL } = required(config, name, [
        'BASETEN_API_KEY',
        'BASETEN_MODEL',
      ]);
      return {
        name,
        baseURL: config.BASETEN_BASE_URL,
        apiKey: BASETEN_API_KEY,
        model: BASETEN_MODEL,
        strongModel: BASETEN_MODEL,
        agent: 'opencode',
      };
    }
  }
}

function required<K extends keyof Config>(
  config: Config,
  backend: BackendName,
  keys: K[],
): Record<K, string> {
  const missing = keys.filter((key) => !config[key]);
  if (missing.length > 0)
    throw new Error(
      `Backend ${backend} needs ${missing.join(', ')} set in .env`,
    );
  return Object.fromEntries(
    keys.map((key) => [key, config[key] as string]),
  ) as Record<K, string>;
}
