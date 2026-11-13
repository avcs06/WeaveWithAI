import { describe, expect, it } from 'vitest';
import { claudeArgs, readClaudeUsage, sinceBefore } from './claude';

const opts = { model: 'claude-sonnet-5-5', maxTurns: 60, effort: 'medium' };
const line = (event: unknown) => JSON.stringify(event);

describe('claudeArgs', () => {
  it('runs headless on stream-json with the model, effort and turns pinned, and only the app\'s settings and MCP servers', () => {
    const args = claudeArgs(opts).join(' ');
    expect(args).toContain('-p --output-format stream-json --verbose');
    expect(args).toContain('--model claude-sonnet-5-5 --effort medium --max-turns 60');
    expect(args).toContain('--permission-mode bypassPermissions');
    expect(args).toContain('--setting-sources project --strict-mcp-config --mcp-config .mcp.json');
    expect(args).toContain('--disallowedTools WebFetch,WebSearch,AskUserQuestion');
  });

  it('starts a session by its id, resumes it when it continues, and names none without one', () => {
    expect(claudeArgs({ ...opts, session: 'u-1' }).slice(-2)).toEqual(['--session-id', 'u-1']);
    expect(claudeArgs({ ...opts, session: 'u-1', continues: true }).slice(-2)).toEqual(['--resume', 'u-1']);
    expect(claudeArgs(opts).join(' ')).not.toMatch(/--session-id|--resume/);
  });
});

describe('readClaudeUsage', () => {
  it('reads the model, the summary, the cost and every model\'s tokens, with cache reads and writes in the input', () => {
    const usage = readClaudeUsage(
      [
        line({ type: 'system', subtype: 'init', model: 'claude-sonnet-5-5' }),
        'not json',
        line({
          type: 'result',
          subtype: 'success',
          is_error: false,
          num_turns: 7,
          result: 'Built S04.',
          total_cost_usd: 0.42,
          modelUsage: {
            'claude-sonnet-5-5': { inputTokens: 100, outputTokens: 50, thinkingTokens: 20, cacheReadInputTokens: 1000, cacheCreationInputTokens: 200 },
            'claude-haiku-5-5': { inputTokens: 10, outputTokens: 5, cacheReadInputTokens: 0, cacheCreationInputTokens: 0 },
          },
        }),
      ].join('\n'),
    );
    expect(usage).toEqual({
      model: 'claude-sonnet-5-5',
      calls: 7,
      input: 1310,
      cached: 1000,
      output: 55,
      reasoning: 20,
      costUsd: 0.42,
      summary: 'Built S04.',
      completed: true,
      reported: true,
    });
  });

  it('reads an error result as not completed, with its errors, or its subtype when it has none', () => {
    const failed = readClaudeUsage(line({ type: 'result', subtype: 'error_during_execution', is_error: true, errors: ['API error 401'] }));
    expect(failed).toMatchObject({ completed: false, summary: 'API error 401', reported: true });
    const cut = readClaudeUsage(line({ type: 'result', subtype: 'error_max_turns', is_error: false, errors: [] }));
    expect(cut).toMatchObject({ completed: false, summary: 'error_max_turns' });
  });

  it('reports nothing for a session with no result, such as a killed one', () => {
    expect(readClaudeUsage(line({ type: 'system', subtype: 'init', model: 'claude-sonnet-5-5' }))).toMatchObject({ reported: false, completed: false, calls: 0 });
  });
});

describe('sinceBefore', () => {
  const totals = { calls: 3, input: 1000, cached: 600, output: 90, reasoning: 10, costUsd: 0.05 };
  const after = { model: 'm', calls: 5, input: 1500, cached: 800, output: 150, reasoning: 30, costUsd: 0.08, summary: '', completed: true, reported: true };

  it("subtracts the totals the Claude Code session had before this one", () => {
    const own = sinceBefore(after, totals);
    expect(own).toMatchObject({ calls: 2, input: 500, cached: 200, output: 60, reasoning: 20 });
    expect(own.costUsd).toBeCloseTo(0.03);
  });

  it('keeps the usage as it is with no totals before, or no result to subtract from', () => {
    expect(sinceBefore(after)).toBe(after);
    const killed = { ...after, reported: false, calls: 0 };
    expect(sinceBefore(killed, totals)).toBe(killed);
  });
});
