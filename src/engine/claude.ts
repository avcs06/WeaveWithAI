// How a coding session calls Claude Code headless, and what it reads back from
// its stream-json events.

export type ClaudeUsage = {
  model: string;
  calls: number;
  input: number;
  cached: number;
  output: number;
  reasoning: number;
  /** Claude Code's estimate over every model the session called. */
  costUsd: number;
  summary: string;
  completed: boolean;
  /** False when no result event came, such as from a killed session; the totals are then zero. */
  reported: boolean;
};

/** The `claude -p` arguments; the task goes on stdin. */
export function claudeArgs(opts: {
  model: string;
  maxTurns: number;
  effort: string;
  /** The unit's Claude Code session: the first session starts it, the fixes continue it. */
  session?: string;
  continues?: boolean;
}): string[] {
  return [
    '-p',
    '--output-format',
    'stream-json',
    // Print mode needs it for stream-json.
    '--verbose',
    '--model',
    opts.model,
    '--effort',
    opts.effort,
    '--max-turns',
    String(opts.maxTurns),
    // Nobody is there to approve; the container is the sandbox, and the hook and the checks judge what it writes.
    '--permission-mode',
    'bypassPermissions',
    // The app's own settings and MCP servers only, none of the user's.
    '--setting-sources',
    'project',
    '--strict-mcp-config',
    '--mcp-config',
    '.mcp.json',
    // No web, and nobody to ask.
    '--disallowedTools',
    'WebFetch,WebSearch,AskUserQuestion',
    ...(opts.session ? [opts.continues ? '--resume' : '--session-id', opts.session] : []),
  ];
}

type ModelUsage = {
  inputTokens?: number;
  outputTokens?: number;
  thinkingTokens?: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
};
type Event = {
  type?: string;
  subtype?: string;
  model?: string;
  is_error?: boolean;
  num_turns?: number;
  result?: string;
  errors?: string[];
  total_cost_usd?: number;
  modelUsage?: Record<string, ModelUsage>;
};

/**
 * The usage, the final text and whether the session completed, from `claude -p --output-format stream-json`. A
 * session that continues another reports the totals since that one began.
 */
export function readClaudeUsage(jsonl: string): ClaudeUsage {
  const usage: ClaudeUsage = { model: '', calls: 0, input: 0, cached: 0, output: 0, reasoning: 0, costUsd: 0, summary: '', completed: false, reported: false };
  for (const line of jsonl.split('\n')) {
    if (!line.trim()) continue;
    let event: Event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type === 'system' && event.subtype === 'init') usage.model = event.model ?? '';
    if (event.type !== 'result') continue;
    usage.reported = true;
    usage.completed = event.subtype === 'success' && !event.is_error;
    usage.summary = event.result || event.errors?.join('\n') || event.subtype || '';
    usage.calls = event.num_turns ?? 0;
    usage.costUsd = event.total_cost_usd ?? 0;
    usage.input = usage.cached = usage.output = usage.reasoning = 0;
    // Input counts the cache reads and writes too, as the spec stages' usage does.
    for (const m of Object.values(event.modelUsage ?? {})) {
      const read = m.cacheReadInputTokens ?? 0;
      usage.input += (m.inputTokens ?? 0) + read + (m.cacheCreationInputTokens ?? 0);
      usage.cached += read;
      usage.output += m.outputTokens ?? 0;
      usage.reasoning += m.thinkingTokens ?? 0;
    }
  }
  return usage;
}

export type Totals = Pick<ClaudeUsage, 'calls' | 'input' | 'cached' | 'output' | 'reasoning' | 'costUsd'>;

/** This session's own share: the totals after it, less those the Claude Code session had before it. */
export function sinceBefore(usage: ClaudeUsage, before?: Totals): ClaudeUsage {
  if (!before || !usage.reported) return usage;
  const less = (key: keyof Totals) => Math.max(0, usage[key] - before[key]);
  return {
    ...usage,
    calls: less('calls'),
    input: less('input'),
    cached: less('cached'),
    output: less('output'),
    reasoning: less('reasoning'),
    costUsd: less('costUsd'),
  };
}
