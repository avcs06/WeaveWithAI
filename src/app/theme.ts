import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { googleFont, TEXT_WEIGHTS } from '../config/fonts';
import { objectKeys, propertyName } from '../ds/ast';
import { PAGE_ROLES, ROLES } from '../stages/design/schema-theme';
import type { Theme } from '../stages/design/theme';

// 02-theme.json written into an app's own files (S1): the brand, base, page
// (divider, backdrop and skeleton included) and entity colors into colors.ts,
// radius and focus ring into tokens.ts, the three families into fonts.ts and
// Storybook's head, and the component defaults into each recipe's
// defaultVariants. Only the status sets stay the template's (THEME-003).

/** The braces of the object after `key: {`, searched within [from, to). */
function block(text: string, key: string, from = 0, to = text.length): [number, number] {
  const start = text.slice(from, to).search(new RegExp(`\\b${key}: \\{`));
  if (start < 0) throw new Error(`no "${key}: {" block`);
  const open = text.indexOf('{', from + start);
  let depth = 0;
  for (let i = open; i < to; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}' && (depth -= 1) === 0) return [open, i];
  }
  throw new Error(`"${key}: {" is not closed`);
}

/** Each `name: '...'` line inside the braces set to its new value. */
function setStrings(text: string, [open, close]: [number, number], values: Record<string, string>): string {
  let inner = text.slice(open, close);
  for (const [name, value] of Object.entries(values)) {
    const line = new RegExp(`(\\n\\s*${name}: )'[^']*'`);
    if (!line.test(inner)) throw new Error(`no ${name} to set`);
    inner = inner.replace(line, `$1'${value}'`);
  }
  return text.slice(0, open) + inner + text.slice(close);
}

/** colors.ts with the theme's brand and base sets, page colors and entity sets in each of its modes. */
export function applyColors(text: string, theme: Theme): string {
  let out = text;
  for (const mode of theme.modes) {
    const colors = theme.colors[mode];
    if (!colors) continue;
    const within = (group: string) => {
      const [open, close] = block(out, group);
      return block(out, mode, open, close);
    };
    out = setStrings(out, within('primary'), Object.fromEntries(ROLES.map((role) => [role, colors.theme[role]])));
    out = setStrings(out, within('base'), Object.fromEntries(ROLES.map((role) => [role, colors.base[role]])));
    out = setStrings(out, within('surface'), Object.fromEntries(PAGE_ROLES.map((role) => [role, colors.page[role]])));
    const [open, close] = within('entity');
    const sets = Object.entries(colors.entity).map(
      ([name, set]) =>
        `      ${name}: {\n${ROLES.map((role) => `        ${role}: '${set[role]}',`).join('\n')}\n      } satisfies ColorSet,`,
    );
    out = out.slice(0, open) + (sets.length ? `{\n${sets.join('\n')}\n    }` : '{}') + out.slice(close + 1);
  }
  return out;
}

/** tokens.ts with the theme's radius and focus ring. */
export function applyTokens(text: string, theme: Theme): string {
  const out = setStrings(text, block(text, 'radius'), theme.radius);
  return out.replace(/(\n\s*focusRing: )'[^']*'/, `$1'${theme.focusRing}'`);
}

const ROLES_BY_USE = [
  ['ui', '--font-ui'],
  ['display', '--font-display'],
  ['mono', '--font-mono'],
] as const;

/** The family, its next/font export and the weights the design system uses, where it has them. */
function family(name: string) {
  const found = googleFont(name);
  if (!found) throw new Error(`${name} is not in the font catalog`);
  const text = TEXT_WEIGHTS.filter((weight) => found.weights.includes(weight));
  return { ...found, use: text.length ? text : found.weights };
}

/** packages/styles/src/fonts.ts loading the theme's three families with next/font. */
export function fontsModule(theme: Theme): string {
  const fonts = ROLES_BY_USE.map(([use, variable]) => {
    const font = family(theme.fonts[use]);
    const id = font.googleName.charAt(0).toLowerCase() + font.googleName.slice(1).replace(/_(\w)/g, (_, c: string) => c.toUpperCase());
    return { ...font, id, variable };
  });
  const imports = [...new Set(fonts.map((font) => font.googleName))].sort().join(', ');
  const calls = fonts.map(
    (font) =>
      `const ${font.id} = ${font.googleName}({\n  subsets: ['latin'],\n  weight: [${font.use.map((w) => `'${w}'`).join(', ')}],\n  variable: '${font.variable}',\n  display: 'swap',\n});`,
  );
  const [ui] = fonts;
  return `import { ${imports} } from 'next/font/google';\n\n${calls.join('\n\n')}\n\nexport const fontClasses = [\n  ${ui?.id}.className,\n${fonts.map((font) => `  ${font.id}.variable,`).join('\n')}\n].join(' ');\n`;
}

/** Storybook's head: the same three families from Google Fonts, since next/font only runs inside Next. */
export function previewHead(theme: Theme): string {
  const fonts = ROLES_BY_USE.map(([use, variable]) => ({ ...family(theme.fonts[use]), variable }));
  const query = fonts
    .map((font) => `family=${font.name.replaceAll(' ', '+')}:wght@${font.use.join(';')}`)
    .join('&');
  return `<!--
  The app loads these fonts with next/font (packages/styles/src/fonts.ts),
  which only runs inside Next.js. Load the same families and weights from
  Google Fonts and define the same CSS variables the font tokens use.
-->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?${query}&display=swap"
/>
<style>
  :root {
${fonts.map((font) => `    ${font.variable}: '${font.name}';`).join('\n')}
  }
</style>
`;
}

type Recipe = {
  defaults: ts.ObjectLiteralExpression;
  variants: Record<string, string[]>;
};

/** The `recipe({ variants, defaultVariants })` call named `name` in a recipes file. */
function readRecipe(source: ts.SourceFile, name: string): Recipe | undefined {
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== name) continue;
      const call = declaration.initializer;
      const [options] = call && ts.isCallExpression(call) ? call.arguments : [];
      if (!options || !ts.isObjectLiteralExpression(options)) return undefined;
      const prop = (key: string) =>
        options.properties.find(
          (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && propertyName(p.name) === key,
        )?.initializer;
      const defaults = prop('defaultVariants');
      const variants = prop('variants');
      if (!defaults || !ts.isObjectLiteralExpression(defaults) || !variants) return undefined;
      const values = (key: string) =>
        objectKeys(
          ts.isObjectLiteralExpression(variants)
            ? variants.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && propertyName(p.name) === key)?.initializer
            : undefined,
        );
      return { defaults, variants: Object.fromEntries(objectKeys(variants).map((key) => [key, values(key)])) };
    }
  }
  return undefined;
}

/** A theme default as recipe variants: variant props as they are, a look as its tokens, following `createLook`. */
export function variantValues(
  variants: Record<string, string[]>,
  preset: Record<string, string>,
): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const [prop, value] of Object.entries(preset))
    if (prop !== 'look' && variants[prop]?.includes(value)) values[prop] = value;
  if (preset.look === undefined) return values;
  const tokens = preset.look.split(' ').filter(Boolean);
  for (const [variant, options] of Object.entries(variants)) {
    if (variant === 'variant' || variant === 'size') continue;
    if (options.includes('true')) values[variant] = tokens.includes(variant);
    else {
      const chosen = options.find((option) => tokens.includes(option));
      if (chosen) values[variant] = chosen;
    }
  }
  return values;
}

/** A recipes file with `name`'s defaultVariants set to `values`; keys it lacks are added. */
export function applyRecipeDefaults(text: string, name: string, values: Record<string, string | boolean>): string {
  const source = ts.createSourceFile('recipe.ts', text, ts.ScriptTarget.Latest, true);
  const recipe = readRecipe(source, name);
  if (!recipe) throw new Error(`no ${name} with defaultVariants`);
  const literal = (value: string | boolean) => (typeof value === 'string' ? `'${value}'` : String(value));
  const edits: [number, number, string][] = [];
  for (const [key, value] of Object.entries(values)) {
    const found = recipe.defaults.properties.find(
      (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && propertyName(p.name) === key,
    );
    if (found) edits.push([found.initializer.getStart(source), found.initializer.getEnd(), literal(value)]);
    else {
      const at = recipe.defaults.getEnd() - 1;
      edits.push([at, at, `${recipe.defaults.properties.hasTrailingComma || !recipe.defaults.properties.length ? '' : ','} ${key}: ${literal(value)},`]);
    }
  }
  let out = text;
  for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0]))
    out = out.slice(0, start) + replacement + out.slice(end);
  return out;
}

/** Writes the theme into an app made from the template; returns what it changed and what it could not. */
export function applyTheme(appDir: string, theme: Theme): { changed: string[]; skipped: string[] } {
  const changed: string[] = [];
  const skipped: string[] = [];
  const write = (file: string, edit: (text: string) => string) => {
    const full = path.join(appDir, file);
    const before = existsSync(full) ? readFileSync(full, 'utf8') : '';
    const after = edit(before);
    if (after === before) return;
    writeFileSync(full, after);
    changed.push(file);
  };
  write('colors.ts', (text) => applyColors(text, theme));
  write('tokens.ts', (text) => applyTokens(text, theme));
  write('packages/styles/src/fonts.ts', () => fontsModule(theme));
  write('packages/ui/.storybook/preview-head.html', () => previewHead(theme));
  for (const [component, preset] of Object.entries(theme.defaults)) {
    // A default belongs to the recipe named after its component; one that only borrows another's would change that component everywhere.
    const file = `packages/ui/src/${component}/${component}.recipes.css.ts`;
    const name = `${component.charAt(0).toLowerCase()}${component.slice(1)}Recipe`;
    const full = path.join(appDir, file);
    const recipe = existsSync(full)
      ? readRecipe(ts.createSourceFile(file, readFileSync(full, 'utf8'), ts.ScriptTarget.Latest, true), name)
      : undefined;
    if (!recipe) {
      skipped.push(`${component}: no ${name} of its own`);
      continue;
    }
    write(file, (text) => applyRecipeDefaults(text, name, variantValues(recipe.variants, preset)));
  }
  return { changed, skipped };
}
