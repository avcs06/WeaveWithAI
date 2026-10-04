# Vendored Weave Design System MCP

Vendored from `@avcs/weave-design-system-mcp` version 1.0.3 on September 28, 2026.
Its MIT license is in LICENSE. This directory is an independent npm package.

Local integration changes support numeric token keys, component source exclusions,
batched TypeScript documentation extraction, and this repository's style policy.
The root designsystem.config.json points at live source files, not a generated
snapshot. Rebuild/restart the server after editing its implementation.

From the repository root, run `pnpm mcp:setup`, then `pnpm mcp:check`.
The upstream unit tests run with `pnpm mcp:test`.

Node ^22.18.0 or >=24.11.0 is required by the upstream package and Babel 8.
Generated projects retain this source, its fixtures, license, and independent
package-lock.json, but not node_modules or dist. Run setup in each generated copy.