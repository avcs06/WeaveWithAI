import { formatHex, parse } from 'culori';

// A page background as CSS (DS35, user 2026-10-31): a color, or gradients of
// colors. Code reads the colors it names, so the brief's rule can check it and
// the theme can check page text on every one of them. Alpha is ignored: a stop
// counts as its opaque color.

const GRADIENT = /^(repeating-)?(linear|radial|conic)-gradient$/;
const COLOR_FUNCTION = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)$/;
const FUNCTIONAL = /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)/gi;
const HEX = /#[0-9a-f]{3,8}\b/gi;
/** Words that parse as a color but name none to check. */
const NOT_A_COLOR = new Set(['transparent', 'currentcolor']);

/** The colors a CSS background names, as hex, in order and once each, and what in it is neither a color nor a gradient. */
export function readBackground(css: string): { colors: string[]; problems: string[] } {
  const problems: string[] = [];
  const colors: string[] = [];
  const add = (text: string) => {
    const color = parse(text);
    if (color) colors.push(formatHex(color));
    else problems.push(`"${text}" is not a valid color`);
  };
  if (/url\s*\(/i.test(css)) problems.push('it loads an image with url()');
  for (const [, name = ''] of css.matchAll(/([a-z-]+)\s*\(/gi))
    if (name.toLowerCase() !== 'url' && !GRADIENT.test(name.toLowerCase()) && !COLOR_FUNCTION.test(name.toLowerCase()))
      problems.push(`it uses ${name}(), which is neither a gradient nor a color`);
  for (const [text] of css.matchAll(FUNCTIONAL)) add(text);
  for (const [text] of css.matchAll(HEX)) add(text);
  const words = css.replace(FUNCTIONAL, ' ').replace(HEX, ' ').replace(/[a-z-]+\s*\(/gi, ' ');
  for (const [word] of words.matchAll(/[a-z]+/gi))
    if (!NOT_A_COLOR.has(word.toLowerCase()) && parse(word)) colors.push(formatHex(parse(word)!));
  if (!colors.length) problems.push('it names no color');
  return { colors: [...new Set(colors.map((c) => c.toUpperCase()))], problems };
}
