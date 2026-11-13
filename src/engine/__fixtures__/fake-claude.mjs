// A stand-in for `claude -p` in tests: writes the files FAKE_WRITES names
// (JSON, path to content) in its cwd, and prints the stream-json events the
// runner reads. The task arrives on stdin.
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const task = readFileSync(0, 'utf8');
// FAKE_STDERR fails the run before it starts, with only that line on stderr.
if (process.env.FAKE_STDERR) {
  console.error(process.env.FAKE_STDERR);
  process.exit(1);
}
// FAKE_ARGS names a file each run appends its arguments to.
if (process.env.FAKE_ARGS) appendFileSync(process.env.FAKE_ARGS, `${process.argv.slice(2).join(' ')}\n`);
// FAKE_VARY makes each run's files differ, as a real fix session's would.
for (const [file, content] of Object.entries(JSON.parse(process.env.FAKE_WRITES ?? '{}'))) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, process.env.FAKE_VARY ? `${content}// ${process.hrtime.bigint()}\n` : content);
}
// FAKE_BEFORE is the turns a resumed session's totals already hold, as Claude Code carries them over.
const before = Number(process.env.FAKE_BEFORE ?? 0);
const credential = process.env.ANTHROPIC_API_KEY ? 'key' : process.env.CLAUDE_CODE_OAUTH_TOKEN ? 'token' : 'none';
const event = (fields) => console.log(JSON.stringify(fields));
event({ type: 'system', subtype: 'init', model: 'claude-sonnet-5-5', session_id: 'fake' });
event({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write' }] } });
event({
  type: 'result',
  subtype: process.env.FAKE_FAIL ? 'error_during_execution' : 'success',
  is_error: Boolean(process.env.FAKE_FAIL),
  num_turns: before + 3,
  result: process.env.FAKE_FAIL ? undefined : `built it (${task.trim().length} characters of task, ${credential})`,
  errors: process.env.FAKE_FAIL ? ['the fake failed'] : undefined,
  total_cost_usd: (before + 3) * 0.01,
  modelUsage: {
    'claude-sonnet-5-5': { inputTokens: (before + 3) * 1000, outputTokens: (before + 3) * 300, thinkingTokens: (before + 3) * 60, cacheReadInputTokens: (before + 3) * 6000, cacheCreationInputTokens: 0 },
  },
});
