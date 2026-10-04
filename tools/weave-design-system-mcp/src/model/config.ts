import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import * as z from 'zod/v4';

import type { DesignToken, PackageConfig, TailwindPolicy, VanillaExtractPolicy } from './types.js';

const CONFIG_FILENAME = 'designsystem.config.json';

const PackageSchema = z.object({
  package: z.string().min(1),
  names: z.union([z.literal('*'), z.array(z.string())]).optional(),
});

const ConfigSchema = z.object({
  /** Token file paths. Each file's format (vanilla-extract theme or plain object) and exports are inferred. */
  tokens: z.array(z.string().min(1)).min(1),
  /** Globs for the project's React component files (`!` excludes). Everything under their folders is design-system code. */
  components: z.array(z.string().min(1)).min(1),
  /** Installed packages whose components join the inventory, read from their type declarations. */
  /** One package, or several. */
  packages: z.union([PackageSchema, z.array(PackageSchema).min(1)]).optional(),
  /** Globs for recipe files: working examples of each component's distinct cases, kept beside it. Recipes are app code. */
  recipes: z.array(z.string().min(1)).min(1).optional(),
  /** A Markdown file of the project's rules for agents, added to the server instructions. */
  brief: z.string().min(1).optional(),
});

export interface ResolvedConfig {
  tokens: string[];
  components: string[];
  packages?: PackageConfig[];
  recipes?: string[];
  brief?: string;
  /** Styles are always vanilla-extract and classNames always Tailwind; the host workspace supplies its rules for both. */
  vanillaExtract?: VanillaExtractPolicy;
  tailwind?: TailwindPolicy;
  /** Directory the config file lives in — adapters that treat a field as a filesystem path resolve relative to this, not to `process.cwd()`. */
  configDir: string;
}

const EXAMPLE_CONFIG = `{
  "tokens": ["src/styles/theme.css.ts"],
  "components": ["src/components/**/*.tsx"],
  "recipes": ["src/components/**/*.recipe.tsx"],
  "brief": "docs/agent-brief.md",
  "packages": { "package": "lucide-react", "names": "*" }
}`;

function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n');
}

/**
 * Loads and validates `designsystem.config.json` from `cwd`, failing with a
 * message that names the offending field for a schema violation, or shows
 * how to create the file when it's missing.
 */
export function loadConfig(cwd: string = process.cwd()): ResolvedConfig {
  const configPath = join(cwd, CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    throw new Error(
      `No ${CONFIG_FILENAME} found in ${cwd}.\n\n` + `Create one there, for example:\n\n${EXAMPLE_CONFIG}\n`,
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`${configPath} is not valid JSON: ${(error as Error).message}`);
  }

  const result = ConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`${configPath} is invalid:\n${formatZodError(result.error)}`);
  }

  const { tokens, components, packages = [], recipes, brief } = result.data;
  if (brief && !existsSync(resolve(dirname(configPath), brief))) {
    throw new Error(`${configPath} is invalid:\n  - brief: ${brief} does not exist`);
  }
  return {
    tokens,
    components,
    packages: Array.isArray(packages) ? packages : [packages],
    recipes,
    brief,
    configDir: resolve(dirname(configPath)),
  };
}
