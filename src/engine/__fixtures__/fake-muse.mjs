// A stand-in for `muse exec` in tests: writes the files FAKE_WRITES names
// (JSON, path to content) in its cwd, and prints the JSONL events the runner
// reads. The key must arrive on stdin.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const key = readFileSync(0, 'utf8');
// FAKE_VARY makes each run's files differ, as a real fix session's would.
for (const [file, content] of Object.entries(JSON.parse(process.env.FAKE_WRITES ?? '{}'))) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, process.env.FAKE_VARY ? `${content}// ${process.hrtime.bigint()}\n` : content);
}
const event = (payload_type, payload) => console.log(JSON.stringify({ payload_type, payload }));
event('tool.result', { correlation_facts: { tool_name: 'write_file', outcome: 'success' } });
event('run.usage', {
  models: [{ model: 'muse-spark-1.3', calls: 3, input_tokens: 30000, cached_tokens: 20000, output_tokens: 1000, reasoning_tokens: 200 }],
});
event(process.env.FAKE_FAIL ? 'run.terminal.failed' : 'run.terminal.completed', {
  text: key ? `built it with key ${key.length}` : 'no key',
});
