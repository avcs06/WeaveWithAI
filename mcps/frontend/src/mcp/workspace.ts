import { serveStdio } from '@modelcontextprotocol/server/stdio';

import type { ResolvedConfig } from '../model/config.js';
import { createDesignSystem } from '../model/design-system.js';
import { createServer } from './server.js';

/**
 * Serves a resolved config over stdio. The design system loads once here, not
 * in the server factory: `serveStdio` may build several `McpServer` instances
 * per connection (one per protocol era) sharing it. Only protocol traffic may
 * go to stdout; log to stderr.
 */
export function serveWorkspace(config: ResolvedConfig): void {
  const system = createDesignSystem(config);
  serveStdio(() => createServer(system), {
    onerror: (error) => console.error('[weave-frontend-mcp]', error),
  });
  console.error(`weave-frontend-mcp ready: ${system.tokens().length} tokens, ${system.components().length} components`);
}
