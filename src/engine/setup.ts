import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execaSync } from 'execa';
import { pathBeside } from '../core/utils';

// Muse Code's config in a generated app (D9.1 A): the MCP servers it loads
// from `.mcp.json`, the hook that validates every file it writes, and a git
// baseline its diff starts from. The scaffold writes the guidelines (CD2).

const MCP = {
  mcpServers: {
    'weave-design-system': { command: 'node', args: ['tools/design-system-mcp.mjs'] },
  },
};
const HOOKS = {
  schema_version: 1,
  hooks: {
    PostToolUse: [
      { matcher: '.*', hooks: [{ type: 'command', command: 'node .weave/hooks/validate-edit.mjs' }] },
    ],
  },
};

export function git(appDir: string, ...args: string[]): string {
  return execaSync('git', ['-c', 'user.name=weave', '-c', 'user.email=weave@local', ...args], { cwd: appDir }).stdout;
}

/** The agent's config and a commit of everything so far, which every session's diff starts from. */
export function prepareApp(appDir: string, message = 'weave: agent setup'): void {
  const at = (...parts: string[]) => path.join(appDir, ...parts);
  mkdirSync(at('.muse'), { recursive: true });
  mkdirSync(at('.weave', 'hooks'), { recursive: true });
  writeFileSync(at('.mcp.json'), `${JSON.stringify(MCP, null, 2)}\n`);
  writeFileSync(at('.muse', 'hooks.json'), `${JSON.stringify(HOOKS, null, 2)}\n`);
  copyFileSync(pathBeside(import.meta.url, './hooks/validate-edit.mjs'), at('.weave', 'hooks', 'validate-edit.mjs'));
  if (!existsSync(at('.git'))) git(appDir, 'init', '-q');
  git(appDir, 'add', '-A');
  git(appDir, 'commit', '-q', '--allow-empty', '-m', message);
}
