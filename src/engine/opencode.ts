import type { Backend } from '../core/backends';
import type { MuseUsage } from './muse';
import { MCP } from './setup';

// How a coding session calls OpenCode headless on an open-weight endpoint, and
// what it reads back from its JSON events. The config travels in
// OPENCODE_CONFIG_CONTENT and the key in KEY_VARIABLE, so neither sits in the
// app, where the agent could change it, nor in the arguments.

/** The provider id the config gives the endpoint; models are `weave/<model>`. */
const PROVIDER = 'weave';
export const KEY_VARIABLE = 'WEAVE_AGENT_KEY';

/** The `opencode run` arguments: the task as the message, and the unit's session once its first session named one. */
export function opencodeArgs(backend: Backend, opts: { task: string; sessionId?: string }): string[] {
  return [
    'run',
    '--format',
    'json',
    '--model',
    `${PROVIDER}/${backend.model}`,
    // Nobody is there to approve; the container is the sandbox, and the config denies what the agent may not do.
    '--auto',
    ...(opts.sessionId ? ['--session', opts.sessionId] : []),
    opts.task,
  ];
}

/** The config: the endpoint on chat completions, the design-system MCP, the plugin that runs the edit hook, and the step limit. */
export function opencodeConfig(backend: Backend, opts: { appDir: string; maxSteps: number; effort: string }): string {
  return JSON.stringify({
    $schema: 'https://opencode.ai/config.json',
    model: `${PROVIDER}/${backend.model}`,
    provider: {
      [PROVIDER]: {
        npm: '@ai-sdk/openai-compatible',
        name: backend.name,
        options: { baseURL: backend.baseURL, apiKey: `{env:${KEY_VARIABLE}}` },
        models: { [backend.model]: { name: backend.model, tool_call: true, options: { reasoningEffort: opts.effort } } },
      },
    },
    mcp: Object.fromEntries(
      Object.entries(MCP.mcpServers).map(([name, server]) => [name, { type: 'local', command: [server.command, ...server.args] }]),
    ),
    plugin: [`file://${opts.appDir}/.weave/hooks/opencode-plugin.mjs`],
    // No web, nothing outside the app, and no subagents: the JSON events leave their calls out of the usage.
    permission: { webfetch: 'deny', websearch: 'deny', external_directory: 'deny', task: 'deny' },
    agent: { build: { steps: opts.maxSteps } },
    autoupdate: false,
    share: 'disabled',
    // The runner commits each session and the checks lint it; OpenCode's own snapshots and formatters would only add work.
    snapshot: false,
    formatter: false,
    lsp: false,
  });
}

type Tokens = { input: number; output: number; reasoning: number; cache: { read: number } };
type Event = {
  type?: string;
  sessionID?: string;
  part?: { reason?: string; text?: string; tokens?: Tokens };
  error?: { name?: string; data?: { message?: string } };
};

/** The usage, the final text, the session and whether the run completed, from `opencode run --format json` output. */
export function readOpencodeUsage(jsonl: string): MuseUsage & { session: string } {
  const usage = { model: '', calls: 0, input: 0, cached: 0, output: 0, reasoning: 0, summary: '', completed: false, childrenIncluded: true, children: 0, session: '' };
  let reason = '';
  let error = '';
  for (const line of jsonl.split('\n')) {
    if (!line.trim()) continue;
    let event: Event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    usage.session ||= event.sessionID ?? '';
    const tokens = event.part?.tokens;
    if (event.type === 'step_finish' && tokens) {
      usage.calls += 1;
      // OpenCode counts cached input apart from input and reasoning apart from output; the bill counts them in.
      usage.input += tokens.input + tokens.cache.read;
      usage.cached += tokens.cache.read;
      usage.output += tokens.output + tokens.reasoning;
      usage.reasoning += tokens.reasoning;
      reason = event.part?.reason ?? '';
    }
    if (event.type === 'text') usage.summary = event.part?.text ?? '';
    if (event.type === 'error') error = event.error?.data?.message ?? event.error?.name ?? 'error';
  }
  // A last step that ends on anything but `stop`, such as a reply with no text and no tool call, leaves the task undone.
  usage.completed = reason === 'stop' && !error;
  if (error) usage.summary = error;
  return usage;
}
