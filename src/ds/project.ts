import ts from 'typescript';
import { constLiteral, literal, parse, record, string } from './ast';

export type ModeValues = {
  light: Record<string, string>;
  dark: Record<string, string>;
};

/**
 * What a project decides once, read from the files it may change, with the
 * template's current values: colors (template AGENTS.md), focus ring and
 * radius (tokens.ts), fonts (fonts.ts).
 */
export type ProjectSettings = {
  colors: {
    file: string;
    /** The primary set: the twelve roles in light and dark. */
    theme: ModeValues;
    /** The surface's page colors; divider, backdrop and skeleton stay. */
    page: ModeValues;
    /** The extra sets under entity, by name. */
    entity: string[];
  };
  focusRing: { file: string; value: string; options: string[] };
  radius: { file: string; surface: string; control: string };
  fonts: { file: string; ui: string; display: string; mono: string };
};

const COLORS = 'colors.ts';
const TOKENS = 'tokens.ts';
const FONTS = 'packages/styles/src/fonts.ts';
const FOCUS_RING = 'packages/styles/src/focusRing.css.ts';
const PAGE_KEYS = ['pageBg', 'frameBg', 'pageFg', 'pageFgMuted'];

function readColors(templateDir: string): ProjectSettings['colors'] {
  const colors = constLiteral(templateDir, COLORS, 'colors');
  const primary = record(colors.primary, `${COLORS} colors.primary`);
  const surface = record(colors.surface, `${COLORS} colors.surface`);
  const entity = record(colors.entity, `${COLORS} colors.entity`);
  const set = (mode: 'light' | 'dark') =>
    Object.fromEntries(
      Object.entries(record(primary[mode], `${COLORS} colors.primary.${mode}`)).map(
        ([role, value]) => [role, string(value, `${COLORS} colors.primary.${mode}.${role}`)],
      ),
    );
  const page = (mode: 'light' | 'dark') => {
    const values = record(surface[mode], `${COLORS} colors.surface.${mode}`);
    return Object.fromEntries(
      PAGE_KEYS.map((key) => [
        key,
        string(values[key], `${COLORS} colors.surface.${mode}.${key}`),
      ]),
    );
  };
  return {
    file: COLORS,
    theme: { light: set('light'), dark: set('dark') },
    page: { light: page('light'), dark: page('dark') },
    entity: Object.keys(record(entity.light, `${COLORS} colors.entity.light`)),
  };
}

function readTokens(
  templateDir: string,
): Pick<ProjectSettings, 'focusRing' | 'radius'> {
  const tokens = constLiteral(templateDir, TOKENS, 'tokens');
  const radius = record(tokens.radius, `${TOKENS} tokens.radius`);
  const rings = constLiteral(templateDir, FOCUS_RING, 'focusRings');
  return {
    focusRing: {
      file: TOKENS,
      value: string(tokens.focusRing, `${TOKENS} tokens.focusRing`),
      options: Object.keys(rings),
    },
    radius: {
      file: TOKENS,
      surface: string(radius.surface, `${TOKENS} tokens.radius.surface`),
      control: string(radius.control, `${TOKENS} tokens.radius.control`),
    },
  };
}

/** `const inter = Inter({ variable: '--font-ui' })`: the Google font behind each variable. */
function readFonts(templateDir: string): ProjectSettings['fonts'] {
  const fonts: Record<string, string> = {};
  for (const statement of parse(templateDir, FONTS).statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const { initializer } of statement.declarationList.declarations) {
      if (!initializer || !ts.isCallExpression(initializer)) continue;
      if (!ts.isIdentifier(initializer.expression)) continue;
      const [options] = initializer.arguments;
      if (!options) continue;
      const variable = record(literal(options), `${FONTS} font options`).variable;
      if (typeof variable === 'string' && variable.startsWith('--font-'))
        fonts[variable.slice('--font-'.length)] = initializer.expression.text;
    }
  }
  return {
    file: FONTS,
    ui: string(fonts.ui, `${FONTS} --font-ui`),
    display: string(fonts.display, `${FONTS} --font-display`),
    mono: string(fonts.mono, `${FONTS} --font-mono`),
  };
}

export function projectSettings(templateDir: string): ProjectSettings {
  return {
    colors: readColors(templateDir),
    ...readTokens(templateDir),
    fonts: readFonts(templateDir),
  };
}
