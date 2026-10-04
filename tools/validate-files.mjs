// Runs the design-system MCP's `validate` on files from disk, the way an agent
// calls it per file: pnpm mcp:validate <file> [<file> …]
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadWorkspaceConfig } from './load-design-system-config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: pnpm mcp:validate <file> [<file> …]');
  process.exit(2);
}

const { createDesignSystem } = await import(
  './weave-design-system-mcp/dist/index.js'
);
const system = createDesignSystem(await loadWorkspaceConfig(root));

let errors = 0;
for (const file of files) {
  const path = relative(root, resolve(file));
  const { findings } = system.validate(readFileSync(file, 'utf8'), path);
  console.log(`${findings.length ? 'FAIL' : 'ok  '} ${path}`);
  for (const finding of findings) {
    errors += finding.severity === 'error' ? 1 : 0;
    console.log(
      `     ${finding.line}:${finding.column} ${finding.severity} ${finding.rule}: ${finding.message}`,
    );
    if (finding.suggestion) console.log(`     → ${finding.suggestion}`);
  }
}
process.exit(errors ? 1 : 0);
