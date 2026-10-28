import { fileURLToPath } from 'node:url';
import { loadWorkspaceConfig } from './load-design-system-config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  const { createDesignSystem } = await import(
    './weave-design-system-mcp/dist/index.js'
  );
  const system = createDesignSystem(await loadWorkspaceConfig(root));
  if (!system.components().length || !system.tokens().length) {
    throw new Error(
      'The design-system configuration must load components and tokens.',
    );
  }
  const diagnostics = system.diagnostics();
  if (diagnostics.length) {
    throw new Error(
      `${diagnostics.length} declaration(s) can't be used:\n${diagnostics.map((line) => `  ${line}`).join('\n')}`,
    );
  }
  console.log(
    `MCP configuration loaded: ${system.components().length} components, ${system.tokens().length} tokens.`,
  );
} catch (error) {
  console.error(`MCP check failed: ${error.message}`);
  process.exitCode = 1;
}
