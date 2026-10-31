import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

import type { DesignSystem } from '../model/types.js';

export const SERVER_NAME = 'weave-frontend-mcp';

// Package-root files resolve the same from src/mcp and dist/mcp.
const require = createRequire(import.meta.url);
export const SERVER_VERSION = (require('../../package.json') as { version: string }).version;
const INSTRUCTIONS = readFileSync(new URL('../../instructions.md', import.meta.url), 'utf8').trim();

function json(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

function text(value: string) {
  return { content: [{ type: 'text' as const, text: value }] };
}

/**
 * Builds an MCP server over an already-loaded `DesignSystem`. Handlers stay
 * thin: call the model, format the result; anything more belongs in `model/`.
 * `serveStdio` may call this factory more than once per connection (one
 * instance per protocol era), so it must stay cheap: no I/O here.
 */
export function createServer(system: DesignSystem): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { instructions: INSTRUCTIONS },
  );

  server.registerTool(
    'list_tokens',
    {
      title: 'List design tokens',
      description:
        'List design tokens, optionally filtered to one group (e.g. "color", "spacing", ' +
        '"radius" — call this with no group first to see what groups this system actually has, ' +
        'since they vary by project). Each token includes the exact `reference` to write in a ' +
        'style file and, when a Tailwind class applies it, its `className` — use either, never ' +
        'the raw resolved value.',
      inputSchema: z.object({
        group: z.string().optional().describe('Restrict results to one token group.'),
      }),
    },
    async ({ group }) => {
      const tokens = system.tokens(group);
      return json({ count: tokens.length, tokens });
    },
  );

  server.registerTool(
    'list_components',
    {
      title: 'List components',
      description:
        'List the component inventory: name, one-line purpose, category, which props are ' +
        'variant-like, and its invalid alternatives — the elements, selectors and package imports ' +
        'it supersedes, which validate rejects. Call this before writing any UI code to see what ' +
        "already exists — do not reach for a raw HTML element or another library's component " +
        'without checking here first.',
      inputSchema: z.object({
        category: z.string().optional().describe('Restrict results to one component category.'),
      }),
    },
    async ({ category }) => {
      const components = system.components(category);
      return json({ count: components.length, components });
    },
  );

  server.registerTool(
    'get_recipe',
    {
      title: 'Get a component recipe',
      description:
        'Get working examples of a component as this project uses it, with its parts: one per ' +
        'distinct case (single or multiple choice, client or server data), each with a comment ' +
        'saying when to use it, plus the options worth knowing (sizes, variants). Pick the case ' +
        'that fits and adapt it. Recipes typecheck, pass lint and validate, and are tested to ' +
        "render on the server and on phones, so there is no need to read the component's source. " +
        'Call this before using any component. An unknown name returns the recipes that exist.',
      inputSchema: z.object({
        name: z
          .string()
          .min(1)
          .describe(
            'Component, recipe or exported hook name, e.g. "Table", "IconButton" or "useValueSync" ' +
              '(an export with no recipe of its own gets the recipe that uses it).',
          ),
      }),
    },
    async ({ name }) => {
      const recipe = system.recipe(name);
      if (recipe) {
        return text(
          `// ${recipe.file}\n// Covers: ${recipe.covers.join(', ') || recipe.name}\n\n${recipe.code}`,
        );
      }
      return json({ found: false, message: `No recipe for "${name}".`, recipes: system.recipes() });
    },
  );

  server.registerTool(
    'search_tokens',
    {
      title: 'Search design tokens',
      description:
        'Find tokens by a free-text query, ranked by relevance — searches token names, groups, ' +
        'references and values. Use this when you know what you want ("elevated surface", ' +
        '"danger", "gutter") but not what this system calls it; use list_tokens when you want to ' +
        'browse a whole group instead.',
      inputSchema: z.object({
        query: z.string().min(1).describe('What to look for, e.g. "background" or "spacing".'),
        limit: z.number().int().positive().max(100).optional().describe('Maximum results (default 20).'),
      }),
    },
    async ({ query, limit }) => {
      const results = system.searchTokens(query, limit);
      return json({ count: results.length, results });
    },
  );

  server.registerTool(
    'search_components',
    {
      title: 'Search components',
      description:
        'Find components by a free-text query, ranked by relevance — searches names, ' +
        'descriptions, categories, prop names and invalid alternatives, so searching for an ' +
        'element, role or package you are about to use ("combobox", "DropdownMenu") finds the ' +
        'component that replaces it. Use this before building any UI element from scratch and ' +
        'use what already exists instead of reimplementing it.',
      inputSchema: z.object({
        query: z.string().min(1).describe('What to look for, e.g. "dialog" or "icon".'),
        limit: z.number().int().positive().max(100).optional().describe('Maximum results (default 20).'),
      }),
    },
    async ({ query, limit }) => {
      const results = system.searchComponents(query, limit);
      return json({ count: results.length, results });
    },
  );

  server.registerTool(
    'validate',
    {
      title: 'Validate code against the design system',
      description:
        "Check a JSX/TSX snippet or a style file's content against the real design system: " +
        'hardcoded values that should be tokens, variant props set outside their allowed set, ' +
        'elements or components the design system supersedes, form fields kept ' +
        "outside react-hook-form and the design system's Controller, and className rules — which " +
        'depend on the file path, so always pass filename. Call this on ' +
        'every piece of UI code you generate before returning it — a finding names the exact ' +
        'constraint broken and, where derivable, the exact fix to apply. Unparseable input comes ' +
        'back as a finding rather than an error.',
      inputSchema: z.object({
        code: z.string().min(1).describe('The code to check.'),
        filename: z
          .string()
          .optional()
          .describe(
            'Path of the file the code belongs in, relative to the workspace root or absolute. ' +
              "Files under the config's component paths get the design-system rules; any other " +
              "path, a recipe, or no path, gets the general rules. A component's own folder (not its " +
              'recipe) may use what it supersedes. A .ts file is parsed without JSX.',
          ),
      }),
    },
    async ({ code, filename }) => json(system.validate(code, filename)),
  );

  return server;
}
