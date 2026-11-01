import type { Backend } from '../core/backends';

// How a coding session calls Muse Code headless (D9.1 A), and what it reads
// back from its JSONL events. The model is always pinned and contributor mode
// is off: the user's global settings default to an expensive model with
// contributor mode on.

export type MuseUsage = {
  model: string;
  calls: number;
  input: number;
  cached: number;
  output: number;
  reasoning: number;
  summary: string;
  completed: boolean;
};

/** The `muse exec` arguments for a backend; the key goes on stdin. */
export function museArgs(
  backend: Backend,
  opts: { promptFile: string; maxSteps: number; effort: string },
): string[] {
  const args = [
    'exec',
    '--json',
    '--trust-workspace',
    '--api-key-stdin',
    '--provider',
    'meta',
    '--model',
    backend.model,
    '--reasoning-effort',
    opts.effort,
    '--contributor-mode',
    'off',
    '--max-model-steps',
    String(opts.maxSteps),
    '--prompt-file',
    opts.promptFile,
  ];
  // Muse Code keeps the key back from a bare --base-url off the Meta API.
  if (backend.name !== 'meta')
    args.push('-c', `endpoint_transport=${JSON.stringify({ base_url: backend.baseURL, auth: 'bearer' })}`);
  return args;
}

/** The usage, the final text and whether the run completed, from `muse exec --json` output. */
export function readUsage(jsonl: string): MuseUsage {
  const usage: MuseUsage = { model: '', calls: 0, input: 0, cached: 0, output: 0, reasoning: 0, summary: '', completed: false };
  for (const line of jsonl.split('\n')) {
    if (!line.trim()) continue;
    let event: { payload_type?: string; payload?: Record<string, unknown> };
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    const payload = event.payload ?? {};
    if (event.payload_type === 'run.usage')
      for (const m of (payload.models ?? []) as Record<string, unknown>[]) {
        usage.model = String(m.model ?? usage.model);
        usage.calls += Number(m.calls ?? 0);
        usage.input += Number(m.input_tokens ?? 0);
        usage.cached += Number(m.cached_tokens ?? 0);
        usage.output += Number(m.output_tokens ?? 0);
        usage.reasoning += Number(m.reasoning_tokens ?? 0);
      }
    if (event.payload_type?.startsWith('run.terminal.')) {
      usage.completed = event.payload_type === 'run.terminal.completed';
      usage.summary = String(payload.text ?? payload.reason ?? '');
    }
  }
  return usage;
}
