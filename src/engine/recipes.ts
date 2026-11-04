// The recipe gate: a design-system component is used only after its recipe
// was read in the unit. The hook refuses a write that breaks it, and the
// runner turns what slipped through into CODE-014. Pure.

/** The hook's marker line at the start of each unit's first session: reads count from the last one. */
export const UNIT_MARKER = 'weave:unit';

/** A design-system import of a file: its package folder, which names the recipe, and the names it brings in. */
export type RecipeImport = { folder: string; names: string[] };

/** A component a file uses whose recipe the unit never asked for. */
export type UnreadRecipe = { component: string; file: string };

const IMPORT = /import\s+(type\s+)?(?:(\{[^}]*\})|[\w$]+)?[^'"]*?from\s+['"]@packages\/(?:ui|recipes)\/([^'"/]+)['"]/g;

/** The `@packages/ui` and `@packages/recipes` imports of a file's text; a type-only import uses no component. */
export function recipeImports(text: string): RecipeImport[] {
  const imports: RecipeImport[] = [];
  for (const match of text.matchAll(IMPORT)) {
    const [, typeOnly, names = '', folder = ''] = match;
    if (typeOnly) continue;
    imports.push({
      folder,
      names: names
        .replace(/[{}]/g, '')
        .split(',')
        .map((name) => name.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0] ?? '')
        .filter(Boolean),
    });
  }
  return imports;
}

/** The recipe names asked of the MCP since the unit's marker, lowercased, from the hook's tool log. */
export function recipeReads(log: string): Set<string> {
  const reads = new Set<string>();
  for (const line of log.split('\n')) {
    let entry: { tool?: string; name?: string };
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.tool === UNIT_MARKER) reads.clear();
    else if (/get_recipe$/.test(entry.tool ?? '') && entry.name) reads.add(entry.name.toLowerCase());
  }
  return reads;
}

/** The imports of `text` whose recipe no read since the marker covers, by folder or by an imported name. */
export function unreadRecipes(text: string, log: string): string[] {
  const reads = recipeReads(log);
  const read = ({ folder, names }: RecipeImport) =>
    reads.has(folder.toLowerCase()) || names.some((name) => reads.has(name.toLowerCase()));
  return [...new Set(recipeImports(text).filter((entry) => !read(entry)).map((entry) => entry.folder))];
}

/** Over a unit's files, each by path and text: every component used without its recipe read, with its file. */
export function unreadInFiles(files: { file: string; text: string }[], log: string): UnreadRecipe[] {
  return files.flatMap(({ file, text }) => unreadRecipes(text, log).map((component) => ({ component, file })));
}
