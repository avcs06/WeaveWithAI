import { serveStdio } from '@modelcontextprotocol/server/stdio';

import type { ResolvedConfig } from '../model/config.js';
import { createDesignSystem } from '../model/design-system.js';
import { createServer } from './server.js';

/**
 * Serves a resolved config over stdio. The design system is loaded once,
 * here, before `serveStdio` starts — not inside the server factory, since
 * `serveStdio` may construct more than one `McpServer` instance over a
 * connection's lifetime (it pins one per protocol era) and re-parsing every
 * source file per instance would be wasted work; every instance shares this
 * one already-loaded `DesignSystem`.
 *
 * Nothing may be written to stdout except protocol traffic, so all logging
 * goes to stderr.
 */
export function serveWorkspace(config: ResolvedConfig): void {
  const system = createDesignSystem(config);
  serveStdio(() => createServer(system), {
    onerror: (error) => console.error('[weave-design-system-mcp]', error),
  });
  console.error(`weave-design-system-mcp ready: ${system.tokens().length} tokens, ${system.components().length} components`);
}
