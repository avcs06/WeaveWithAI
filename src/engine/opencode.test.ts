import { describe, expect, it } from 'vitest';
import { resolveBackend } from '../core/backends';
import { ConfigSchema } from '../core/env';
import { KEY_VARIABLE, opencodeArgs, opencodeConfig, readOpencodeUsage } from './opencode';

const config = ConfigSchema.parse({ MODEL_API_KEY: 'k', BASETEN_API_KEY: 'bt-key', BASETEN_MODEL: 'meta-models/muse-spark-open-1026' });
const baseten = resolveBackend(config, 'baseten');

describe('opencodeArgs', () => {
  it('runs the task on the endpoint model with JSON events and nobody to approve, and continues a session once named', () => {
    const args = opencodeArgs(baseten, { task: 'Build S04.' });
    expect(args.slice(0, 3)).toEqual(['run', '--format', 'json']);
    expect(args.join(' ')).toContain('--model weave/meta-models/muse-spark-open-1026');
    expect(args).toContain('--auto');
    expect(args).not.toContain('--session');
    expect(args.at(-1)).toBe('Build S04.');
    expect(opencodeArgs(baseten, { task: 'Fix it.', sessionId: 'ses_1' }).join(' ')).toContain('--session ses_1 Fix it.');
  });
});

describe('opencodeConfig', () => {
  it('names the key variable and never the key, and loads the MCP, the hook plugin and the step limit', () => {
    const text = opencodeConfig(baseten, { appDir: '/app', maxSteps: 60, effort: 'medium' });
    expect(text).not.toContain('bt-key');
    const parsed = JSON.parse(text);
    expect(parsed.model).toBe('weave/meta-models/muse-spark-open-1026');
    expect(parsed.provider.weave).toMatchObject({
      npm: '@ai-sdk/openai-compatible',
      options: { baseURL: 'https://inference.baseten.co/v1', apiKey: `{env:${KEY_VARIABLE}}` },
    });
    expect(parsed.provider.weave.models['meta-models/muse-spark-open-1026'].options).toEqual({ reasoningEffort: 'medium' });
    expect(parsed.mcp['weave-design-system']).toEqual({ type: 'local', command: ['node', 'tools/design-system-mcp.mjs'] });
    expect(parsed.plugin).toEqual(['file:///app/.weave/hooks/opencode-plugin.mjs']);
    expect(parsed.agent.build.steps).toBe(60);
    expect(parsed.permission).toMatchObject({ webfetch: 'deny', websearch: 'deny', external_directory: 'deny', task: 'deny' });
  });
});

describe('readOpencodeUsage', () => {
  const tokens = { total: 1050, input: 400, output: 40, reasoning: 10, cache: { write: 0, read: 600 } };
  const step = (reason: string) => JSON.stringify({ type: 'step_finish', sessionID: 'ses_1', part: { type: 'step-finish', reason, tokens } });
  const text = (value: string) => JSON.stringify({ type: 'text', sessionID: 'ses_1', part: { type: 'text', text: value } });

  it('sums every step with cached input and reasoning counted in, and reads the last text and the session', () => {
    const usage = readOpencodeUsage([step('tool-calls'), text('Reading.'), 'not json', text('Built S04.'), step('stop')].join('\n'));
    expect(usage).toMatchObject({ calls: 2, input: 2000, cached: 1200, output: 100, reasoning: 20, completed: true, summary: 'Built S04.', session: 'ses_1' });
  });

  it('reads a run whose last step ends on anything but stop as not completed', () => {
    expect(readOpencodeUsage([step('tool-calls'), step('unknown')].join('\n')).completed).toBe(false);
  });

  it('reads an error event as not completed, with its message', () => {
    const error = JSON.stringify({ type: 'error', sessionID: 'ses_1', error: { name: 'APIError', data: { message: '401 Unauthorized' } } });
    expect(readOpencodeUsage([step('stop'), error].join('\n'))).toMatchObject({ completed: false, summary: '401 Unauthorized' });
  });
});
