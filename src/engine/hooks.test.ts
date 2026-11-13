import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { pathBeside } from '../core/utils';

// The PostToolUse hook, run as Claude Code runs it: the tool call as JSON on stdin, in the app folder.
const hook = pathBeside(import.meta.url, './hooks/validate-edit.mjs');
const root = mkdtempSync(path.join(tmpdir(), 'weave-hook-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

function app(id: string, log: string): string {
  const dir = path.join(root, id);
  mkdirSync(path.join(dir, '.weave'), { recursive: true });
  mkdirSync(path.join(dir, 'web/app/components/AccountMenu'), { recursive: true });
  writeFileSync(path.join(dir, '.weave/tools.log'), log);
  writeFileSync(
    path.join(dir, 'web/app/components/AccountMenu/AccountMenu.tsx'),
    "import { Avatar } from '@packages/ui/Avatar';\nimport { PlainButton } from '@packages/ui/Button';\nexport const AccountMenu = () => <PlainButton><Avatar name=\"Ada\" /></PlainButton>;\n",
  );
  return dir;
}

const call = (dir: string, input: unknown) =>
  spawnSync(process.execPath, [hook], { cwd: dir, input: JSON.stringify(input), encoding: 'utf8' });
const FILE = 'web/app/components/AccountMenu/AccountMenu.tsx';
// Claude Code names the file by its absolute path.
const write = (dir: string) => ({ tool_name: 'Write', tool_input: { file_path: path.join(dir, FILE) } });
const read = (name: string) => `${JSON.stringify({ at: '2026-11-02T10:00:00.000Z', tool: 'mcp__weave-design-system__get_recipe', name })}\n`;

describe('the edit hook', () => {
  it('logs every call with the recipe or component name an MCP call asks for', () => {
    const dir = app('log', '');
    expect(call(dir, { tool_name: 'mcp__weave-design-system__get_recipe', tool_input: { name: 'Avatar' } }).status).toBe(0);
    const line = JSON.parse(readFileSync(path.join(dir, '.weave/tools.log'), 'utf8').trim());
    expect(line).toMatchObject({ tool: 'mcp__weave-design-system__get_recipe', name: 'Avatar' });
  });

  it("logs a written file by its path in the app", () => {
    const dir = app('relative', read('Avatar') + read('Button'));
    expect(call(dir, write(dir)).status).toBe(0);
    const lines = readFileSync(path.join(dir, '.weave/tools.log'), 'utf8').trim().split('\n');
    expect(JSON.parse(lines.at(-1) ?? '')).toMatchObject({ tool: 'Write', path: FILE });
  });

  it('refuses a written file that uses a component whose recipe this unit has not read, naming each', () => {
    const dir = app('unread', read('Button'));
    const result = call(dir, write(dir));
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('uses Avatar without reading the recipe');
    expect(result.stderr).not.toContain('Button');
  });

  it('lets the file through once the recipe was read, by its folder or by an export it covers', () => {
    const folder = app('folder', read('Avatar') + read('Button'));
    expect(call(folder, write(folder)).status).toBe(0);
    const exported = app('export', read('avatar') + read('PlainButton'));
    expect(call(exported, write(exported)).status).toBe(0);
  });

  it('counts reads from the last unit marker only', () => {
    const marker = `${JSON.stringify({ at: '2026-11-02T10:00:00.000Z', tool: 'weave:unit', unit: 'pages' })}\n`;
    const dir = app('marker', read('Avatar') + read('Button') + marker);
    const result = call(dir, write(dir));
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('Avatar, Button');
  });
});
