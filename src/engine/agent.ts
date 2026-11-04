import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { StageContext } from '../agents/stages';
import type { Backend } from '../core/backends';
import { runPath } from '../core/run';
import { agentDir, dockerArgs, ensureAgentImage, IN_CONTAINER, seedModelCatalog } from './docker';
import { museArgs, type MuseUsage, readUsage } from './muse';
import { KEY_VARIABLE, opencodeArgs, opencodeConfig, readOpencodeUsage } from './opencode';

// How a session starts its backend's coding agent: Muse Code, or OpenCode on
// Baseten. Either runs in the agent container unless MUSE_DOCKER is false;
// tests pass their own executable.

export type AgentRun = {
  command: string[];
  /** What goes on stdin: Muse Code reads its key there. */
  input: string;
  env: Record<string, string>;
  /** A Muse Code login on the Meta API, whose allowance pays instead of a key. */
  subscription: boolean;
  /** The usage from the agent's stdout, and the session it ran in when the agent names its own. */
  read: (stdout: string) => MuseUsage & { session?: string };
};

export async function agentRun(
  ctx: StageContext,
  backend: Backend,
  appDir: string,
  opts: { task: string; promptFile: string; maxSteps: number; sessionId?: string },
  bin?: string[],
): Promise<AgentRun> {
  const inContainer = !bin && ctx.config.MUSE_DOCKER === true;
  const data = runPath(ctx.run, backend.agent);
  mkdirSync(data, { recursive: true });

  if (backend.agent === 'opencode') {
    const env: Record<string, string> = {
      [KEY_VARIABLE]: backend.apiKey,
      OPENCODE_CONFIG_CONTENT: opencodeConfig(backend, {
        appDir: inContainer ? IN_CONTAINER.app : path.resolve(appDir),
        maxSteps: opts.maxSteps,
        effort: 'medium',
      }),
      OPENCODE_DISABLE_AUTOUPDATE: '1',
      OPENCODE_DISABLE_MODELS_FETCH: '1',
      // OpenCode installs its plugin SDK in its config folder; in the run's data that happens once a run, not every session.
      // Its state goes there too: Docker makes the data mount's parent, /tmp/.local, root's, so OpenCode cannot add state beside it.
      ...(inContainer && { OPENCODE_CONFIG_DIR: `${IN_CONTAINER.opencode.data}/config`, XDG_STATE_HOME: `${IN_CONTAINER.opencode.data}/state` }),
    };
    const command = bin ?? (inContainer
      ? ['docker', ...dockerArgs(await ensureAgentImage(), appDir, agentDir(ctx.config.OPENCODE_BIN), { agent: 'opencode', data, env: Object.keys(env) })]
      : [ctx.config.OPENCODE_BIN]);
    return {
      command: [...command, ...opencodeArgs(backend, { task: opts.task, sessionId: opts.sessionId })],
      input: '',
      env,
      subscription: false,
      read: readOpencodeUsage,
    };
  }

  // The subscription is a Muse Code login on the Meta API; the open-weight backends have only keys.
  const subscription = ctx.config.MUSE_AUTH === 'subscription' && backend.name === 'meta';
  const login = subscription ? path.join(os.homedir(), '.config', 'muse') : undefined;
  if (inContainer && backend.name !== 'meta') seedModelCatalog(data);
  const command = bin ?? (inContainer
    ? ['docker', ...dockerArgs(await ensureAgentImage(), appDir, agentDir(ctx.config.MUSE_BIN), { login, data })]
    : [ctx.config.MUSE_BIN]);
  const args = museArgs(backend, { promptFile: opts.promptFile, maxSteps: opts.maxSteps, effort: 'medium', inContainer, subscription, sessionId: opts.sessionId });
  return { command: [...command, ...args], input: subscription ? '' : backend.apiKey, env: {}, subscription, read: readUsage };
}
