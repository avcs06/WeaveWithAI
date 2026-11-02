import { existsSync, globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { execa } from 'execa';
import { pathBeside, sha256, writeJsonAtomic } from '../core/utils';
import { componentLooks, type Defaults, readRecipes } from './looks';
import { projectSettings, type ProjectSettings } from './project';

export type InventoryComponent = {
  name: string;
  category: string;
  description: string;
  /** The closed-set props and their values: `variant`, `size`. */
  variants: Record<string, string[]>;
  /** The recipe's default variant values, which a project may change once. */
  defaults?: Defaults;
  /** Every look the `look` prop accepts, the default first. */
  looks?: string[];
  /** Fixed dimensions, padding and gap in px by size or part: `sm`, `trigger`, `md/header`, `default`. Dynamic ones are absent. */
  box?: Record<string, Box>;
};

/**
 * A minimum height is one the content can grow past. Padding is the inset to
 * the content, top, right, bottom, left; gap is between the children.
 */
export type Box = {
  height?: number;
  width?: number;
  minHeight?: number;
  padding?: [number, number, number, number];
  gap?: number;
};

export type InventoryToken = {
  /** Dot path, `spacing.4`; the group is the first segment. */
  name: string;
  group: string;
  reference: string;
  className?: string;
  value?: string;
};

export type Inventory = {
  components: InventoryComponent[];
  tokens: InventoryToken[];
  project: ProjectSettings;
};

export type InventoryOptions = {
  templateDir?: string;
  cacheDir?: string;
  /** The export command, run with the template as working directory. */
  exporter?: Command;
  /** The measured boxes; `pnpm ds:measure` rewrites the default `src/ds/boxes.json` from Storybook on 6006. */
  boxesFile?: string;
};

type Command = { file: string; args: string[] };

/** What the template's exporter prints; only the parts the design stage needs are kept. */
type Exported = {
  components: {
    name: string;
    file?: string;
    category: string;
    description: string;
    props: { name: string; allowedValues?: string[]; description?: string }[];
  }[];
  tokens: InventoryToken[];
};

/** Hand-written beside this file: entries the exporter cannot see (toast). */
type Curated = {
  extra: Pick<
    InventoryComponent,
    'name' | 'category' | 'description' | 'variants' | 'defaults'
  >[];
};

const curated = (): Curated =>
  JSON.parse(
    readFileSync(pathBeside(import.meta.url, './curated.json'), 'utf8'),
  ) as Curated;

const EXPORTER = { file: 'node', args: ['tools/export-design-system.mjs'] };
// Rendered only by other components or by code, never placed by a design.
const INTERNAL = new Set([
  'MenuItem',
  'MenuGroup',
  'UIRoot',
  'Controller',
  'ControlBox',
  'ControlLabel',
  'ControlMessage',
  'PlainButton',
  'ErrorBoundary',
  'CheckIcon',
  'LoadingIcon',
  'MinusIcon',
]);
const SOURCES = [
  'packages/*/src/**/*',
  'tokens.ts',
  'colors.ts',
  'designsystem.config.json',
];
const isTestOrStory = (file: string) =>
  /\.(test|stories)\.[cm]?[jt]sx?$/.test(file);

/** A hash over the design-system sources: the same files give the same hash. */
export function sourcesHash(templateDir: string): string {
  const files = globSync(SOURCES, { cwd: templateDir, withFileTypes: true })
    .filter((entry) => entry.isFile() && !isTestOrStory(entry.name))
    .map((entry) =>
      path.relative(templateDir, path.join(entry.parentPath, entry.name)),
    )
    .sort();
  const lines = files.map(
    (file) =>
      `${file} ${sha256(readFileSync(path.join(templateDir, file), 'utf8'))}`,
  );
  return sha256(lines.join('\n'));
}

/** Runs a template tool and parses the JSON it prints. */
async function runTool<T>(
  templateDir: string,
  command: Command,
  hint: string,
): Promise<T> {
  try {
    const { stdout } = await execa(command.file, command.args, {
      cwd: templateDir,
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(stdout) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${hint}\n${message}`);
  }
}

/** `Button/sm` or `Dialog/md/header` goes to Button or Dialog under the rest of its key; a bare name under `default`. */
function attachBoxes(
  components: InventoryComponent[],
  boxes: Record<string, Box>,
): void {
  const byName = new Map(components.map((component) => [component.name, component]));
  for (const [key, box] of Object.entries(boxes)) {
    const slash = key.indexOf('/');
    const component = byName.get(slash === -1 ? key : key.slice(0, slash));
    if (!component) throw new Error(`box ${key}: no such component`);
    (component.box ??= {})[slash === -1 ? 'default' : key.slice(slash + 1)] = box;
  }
}

/** The design system as data, exported once per sources hash and cached. */
export async function inventory(
  opts: InventoryOptions = {},
): Promise<Inventory> {
  const templateDir = path.resolve(opts.templateDir ?? 'template');
  const cacheDir = opts.cacheDir ?? '.weave-cache';
  const boxesText = readFileSync(
    opts.boxesFile ?? pathBeside(import.meta.url, './boxes.json'),
    'utf8',
  );
  // A new measurement makes a new cache file, as a changed source does.
  const cacheFile = path.join(
    cacheDir,
    `inventory-${sha256(sourcesHash(templateDir) + boxesText)}.json`,
  );
  if (existsSync(cacheFile))
    return JSON.parse(readFileSync(cacheFile, 'utf8')) as Inventory;

  const exported = await runTool<Exported>(
    templateDir,
    opts.exporter ?? EXPORTER,
    'design-system export failed (is the MCP built? pnpm --dir template mcp:setup)',
  );
  const boxes = JSON.parse(boxesText) as Record<string, Box>;
  const recipes = readRecipes(templateDir);
  // The web app is a placeholder, and a config component (Table.Sort) renders nothing.
  const kept = exported.components.filter(
    (component) =>
      !component.file?.startsWith('web/') &&
      !INTERNAL.has(component.name) &&
      !/^Config component\b/.test(component.description),
  );
  const components: InventoryComponent[] = [
    ...kept.map(({ name, category, description, props }) => ({
      name,
      category,
      description,
      variants: Object.fromEntries(
        props.flatMap((prop) =>
          prop.allowedValues?.length ? [[prop.name, prop.allowedValues]] : [],
        ),
      ),
      ...componentLooks(recipes, { name, category, props }),
    })),
    ...curated().extra,
  ];
  attachBoxes(components, boxes);
  const result: Inventory = {
    components,
    tokens: exported.tokens,
    project: projectSettings(templateDir),
  };
  writeJsonAtomic(cacheFile, result);
  return result;
}

/** The spacing token keys, numeric ones first in order, then the named ones as listed. */
export function spacingKeys(inv: Inventory): [string, ...string[]] {
  const keys = inv.tokens
    .filter((token) => token.group === 'spacing')
    .map((token) => token.name.slice('spacing.'.length));
  const numeric = keys
    .filter((key) => !Number.isNaN(Number(key)))
    .sort((a, b) => Number(a) - Number(b));
  const named = keys.filter((key) => Number.isNaN(Number(key)));
  const [first, ...rest] = [...numeric, ...named];
  if (first === undefined) throw new Error('inventory has no spacing tokens');
  return [first, ...rest];
}
