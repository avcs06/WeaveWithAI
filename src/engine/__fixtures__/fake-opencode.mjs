// A stand-in for `opencode run --format json` in tests: writes the files
// FAKE_WRITES names (JSON, path to content) in its cwd, and prints the JSON
// events the runner reads, in the session --session names or a new one. The
// key and the config arrive in the environment.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
// FAKE_ARGS names a file each run appends its arguments to.
if (process.env.FAKE_ARGS) appendFileSync(process.env.FAKE_ARGS, `${args.join(' ')}\n`);
for (const [file, content] of Object.entries(JSON.parse(process.env.FAKE_WRITES ?? '{}'))) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}
const at = args.indexOf('--session');
const sessionID = at >= 0 ? args[at + 1] : 'ses_fake1';
const event = (type, part) => console.log(JSON.stringify({ type, timestamp: 1, sessionID, part }));
const tokens = { total: 1050, input: 400, output: 40, reasoning: 10, cache: { write: 0, read: 600 } };
event('step_finish', { type: 'step-finish', reason: 'tool-calls', tokens, cost: 0 });
const config = JSON.parse(process.env.OPENCODE_CONFIG_CONTENT ?? '{}');
event('text', { type: 'text', text: `built it with key ${process.env.WEAVE_AGENT_KEY?.length ?? 0} on ${config.model}` });
event('step_finish', { type: 'step-finish', reason: process.env.FAKE_FAIL ? 'unknown' : 'stop', tokens, cost: 0 });
