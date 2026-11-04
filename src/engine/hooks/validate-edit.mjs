// Muse Code PostToolUse hook, copied into each app: logs every tool call to
// .weave/tools.log, so the runner sees what the agent read, refuses a file
// that uses a design-system component whose recipe this unit has not read,
// and runs MCP validate on a file the agent just wrote, sending the findings
// back (exit 2).
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {}
const tool = input.tool_name ?? '';
const file = input.tool_input?.path ?? input.tool_input?.file_path ?? '';
const command = input.tool_input?.command ?? input.tool_input?.cmd ?? '';
const name = typeof input.tool_input?.name === 'string' ? input.tool_input.name : '';
// `at` is when the call finished, so the gap to the line before is the model's turn and the tool's run.
appendFileSync('.weave/tools.log', `${JSON.stringify({ at: new Date().toISOString(), tool, path: file || undefined, command: command || undefined, name: name || undefined })}\n`);
// Only what the agent wrote: a file it read is not its work to fix.
if (!/write|edit|patch/i.test(tool) || !/\.tsx?$/.test(file) || !existsSync(file)) process.exit(0);

// The recipe gate, as src/engine/recipes.ts reads it: the recipes asked since the unit's marker cover every
// `@packages/ui` and `@packages/recipes` import, by folder or by an imported name.
const reads = new Set();
for (const line of readFileSync('.weave/tools.log', 'utf8').split('\n')) {
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    continue;
  }
  if (entry.tool === 'weave:unit') reads.clear();
  else if (/get_recipe$/.test(entry.tool ?? '') && entry.name) reads.add(entry.name.toLowerCase());
}
const unread = new Set();
const imports = /import\s+(type\s+)?(?:(\{[^}]*\})|[\w$]+)?[^'"]*?from\s+['"]@packages\/(?:ui|recipes)\/([^'"/]+)['"]/g;
for (const [, typeOnly, names = '', folder] of readFileSync(file, 'utf8').matchAll(imports)) {
  if (typeOnly) continue;
  const imported = names.replace(/[{}]/g, '').split(',').map((part) => part.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]).filter(Boolean);
  if (!reads.has(folder.toLowerCase()) && !imported.some((part) => reads.has(part.toLowerCase()))) unread.add(folder);
}
if (unread.size) {
  process.stderr.write(`${file} uses ${[...unread].join(', ')} without reading the recipe. Call get_recipe for each, then write the file to the case that fits.\n`);
  process.exit(2);
}
if (!existsSync('tools/validate-files.mjs')) process.exit(0);
const run = spawnSync('node', ['tools/validate-files.mjs', file], { encoding: 'utf8' });
appendFileSync('.weave/hook.log', `${tool} ${file}: validate exit ${run.status}\n`);
if (run.status !== 0) {
  process.stderr.write(`MCP validate found problems in ${file}. Fix every finding:\n${run.stdout}${run.stderr}\n`);
  process.exit(2);
}
