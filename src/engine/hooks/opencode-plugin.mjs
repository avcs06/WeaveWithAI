// OpenCode plugin, copied into each app beside validate-edit.mjs: hands every
// tool call to that hook as Muse Code would, and puts what it refuses (exit 2)
// at the end of the tool's output, where the model reads it.
import { spawnSync } from 'node:child_process';

export const WeaveHooks = async ({ directory }) => ({
  'tool.execute.after': async (input, output) => {
    const args = input.args ?? {};
    const hook = spawnSync('node', ['.weave/hooks/validate-edit.mjs'], {
      cwd: directory,
      input: JSON.stringify({ tool_name: input.tool, tool_input: { path: args.filePath, command: args.command, name: args.name } }),
      encoding: 'utf8',
    });
    if (hook.status === 2) output.output = `${output.output}\n\n${hook.stderr}`;
  },
});
