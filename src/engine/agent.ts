import { mkdirSync } from 'node:fs';
import type { StageContext } from '../agents/stages';
import { runPath } from '../core/run';
import { type ClaudeUsage, claudeArgs, readClaudeUsage } from './claude';
import { agentBinary, dockerArgs, ensureAgentImage } from './docker';

// How a session starts Claude Code: in the agent container unless CLAUDE_DOCKER
// is false; tests pass their own executable.

export type AgentRun = {
  command: string[];
  /** What goes on stdin: the task. */
  input: string;
  /** The whole environment: the runner's own, with only the credential this session uses. */
  env: Record<string, string | undefined>;
  /** A Claude subscription's token, whose allowance pays instead of a key. */
  subscription: boolean;
  read: (stdout: string) => ClaudeUsage;
};

export async function agentRun(
  ctx: StageContext,
  appDir: string,
  opts: { task: string; maxSteps: number; session?: string; continues?: boolean },
  bin?: string[],
): Promise<AgentRun> {
  const { config } = ctx;
  const inContainer = !bin && config.CLAUDE_DOCKER === true;
  const subscription = config.CLAUDE_AUTH === 'subscription';
  // Claude Code prefers a key to a token, so a subscription session must not inherit the key from .env.
  const { ANTHROPIC_API_KEY: _key, CLAUDE_CODE_OAUTH_TOKEN: _token, ...inherited } = process.env;
  const credential: Record<string, string> = subscription
    ? { CLAUDE_CODE_OAUTH_TOKEN: config.CLAUDE_CODE_OAUTH_TOKEN ?? '' }
    : { ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY };

  let command = bin ?? [config.CLAUDE_BIN];
  if (inContainer) {
    // Claude Code's sessions stay in the run, so a fix session can continue the one before it.
    const data = runPath(ctx.run, 'claude');
    mkdirSync(data, { recursive: true });
    command = ['docker', ...dockerArgs(await ensureAgentImage(), appDir, agentBinary(config.CLAUDE_BIN), { data, env: Object.keys(credential) })];
  }
  const args = claudeArgs({ model: config.LLM_MODEL, maxTurns: opts.maxSteps, effort: 'medium', session: opts.session, continues: opts.continues });
  return { command: [...command, ...args], input: opts.task, env: { ...inherited, ...credential }, subscription, read: readClaudeUsage };
}
