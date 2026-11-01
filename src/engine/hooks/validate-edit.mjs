// Muse Code PostToolUse hook, copied into each app: logs every tool call to
// .weave/tools.log, so the runner sees what the agent read, and runs MCP
// validate on a file the agent just wrote, sending the findings back (exit 2).
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {}
const tool = input.tool_name ?? '';
const file = input.tool_input?.path ?? input.tool_input?.file_path ?? '';
const command = input.tool_input?.command ?? input.tool_input?.cmd ?? '';
appendFileSync('.weave/tools.log', `${JSON.stringify({ tool, path: file || undefined, command: command || undefined })}\n`);
// Only what the agent wrote: a file it read is not its work to fix.
if (!/write|edit|patch/i.test(tool) || !/\.tsx?$/.test(file) || !existsSync(file)) process.exit(0);
const run = spawnSync('node', ['tools/validate-files.mjs', file], { encoding: 'utf8' });
appendFileSync('.weave/hook.log', `${tool} ${file}: validate exit ${run.status}\n`);
if (run.status !== 0) {
  process.stderr.write(`MCP validate found problems in ${file}. Fix every finding:\n${run.stdout}${run.stderr}\n`);
  process.exit(2);
}
