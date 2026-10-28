import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadWorkspaceConfig } from './load-design-system-config.mjs';

// Resolve from this file, never the MCP client's working directory.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const server = new URL('./weave-design-system-mcp/dist/mcp/stdio.js', import.meta.url);

if (!existsSync(server) || !existsSync(join(root, 'tools/weave-design-system-mcp/node_modules'))) {
  console.error('MCP is not installed/built. Run pnpm mcp:setup in ' + root);
  process.exitCode = 1;
} else {
  const { serveWorkspace } = await import('./weave-design-system-mcp/dist/index.js');
  const config = await loadWorkspaceConfig(root);
  serveWorkspace(config);
}