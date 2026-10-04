# Agent rules

## Colors

- Neutral and status colors stay the same in every project.
- Only theme colors change per project.
- A project that needs additional color sets like secondary, or entity specific adds them under `entity`.
- If a usage case has no matching color, add it to `neutral`.

## Components

- Every component is accessible: correct roles, accessible names and states, and usable by keyboard and screen reader.
- Every component ships with tests in `<Name>.test.tsx`: its behavior, and axe on each state (`renderUI` and `axe` from `test-utils`).
- Every component ships with stories in `<Name>.stories.tsx`, following the existing ones. All of a component's stories go on a single page: every style, variant, size and state that applies, and a toggle to turn each feature on and off.
- Don't restate styles the global styles already set in global-vanilla.css.ts, such as the font family.
- Comments explain what the code can't say. No comments that repeat a name or the obvious.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
