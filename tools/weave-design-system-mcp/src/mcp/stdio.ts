#!/usr/bin/env node
import { resolve } from 'node:path';

import { loadConfig } from '../model/config.js';
import { serveWorkspace } from './workspace.js';

/**
 * Which folder holds `designsystem.config.json`. An MCP client always
 * controls a server's arguments and environment, but not every client can
 * set its working directory, so the workspace is nameable by argument or
 * environment variable, with the working directory as the fallback.
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
  console.error('Fatal error starting weave-design-system-mcp:', error);
  process.exit(1);
}
