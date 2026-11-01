// Muse Code PostToolUse hook, copied into each app: runs MCP validate on a
// file the agent just wrote and sends the findings back to it (exit 2).
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {}
const file = input.tool_input?.path ?? input.tool_input?.file_path ?? '';
if (!/\.tsx?$/.test(file) || !existsSync(file)) process.exit(0);
const run = spawnSync('node', ['tools/validate-files.mjs', file], { encoding: 'utf8' });
appendFileSync('.weave/hook.log', `${input.tool_name} ${file}: validate exit ${run.status}\n`);
if (run.status !== 0) {
  process.stderr.write(`MCP validate found problems in ${file}. Fix every finding:\n${run.stdout}${run.stderr}\n`);
  process.exit(2);
}
