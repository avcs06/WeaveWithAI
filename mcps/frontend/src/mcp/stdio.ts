#!/usr/bin/env node
import { resolve } from 'node:path';

import { loadConfig } from '../model/config.js';
import { serveWorkspace } from './workspace.js';

/**
 * Which folder holds `designsystem.config.json`: named by argument or
 * environment variable, since not every MCP client can set the working
 * directory; the working directory is the fallback.
 */
function workspacePath(): string {
  const fromArgs = process.argv[2];
  const fromEnv = process.env.DESIGN_SYSTEM_PATH;
  return resolve(fromArgs ?? fromEnv ?? process.cwd());
}

// Standalone entrypoint: serves the workspace's config with no host-supplied styling policy.
try {
  serveWorkspace(loadConfig(workspacePath()));
} catch (error: unknown) {
  console.error('Fatal error starting weave-frontend-mcp:', error);
  process.exit(1);
}
