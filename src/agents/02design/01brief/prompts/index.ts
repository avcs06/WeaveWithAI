import { converter } from 'culori';
import {
  fillPrompt,
  json,
  loadPrompt,
  stripComments,
} from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../../01flows/01scope/schema';
import { DISPLAY_FONTS, googleFont, MONO_FONTS, UI_FONTS } from '../fonts';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** One reference color per name; the prompt shows its OKLCH hue, so a model that thinks in HSL or names picks the right degrees (DS26). */
const NAMED_COLORS = {
  red: '#FF0000',
  orange: '#FF8000',
  amber: '#FFBF00',
  yellow: '#FFFF00',
  green: '#00C000',
  mint: '#00E0A0',
  teal: '#00A0A0',
  sky: '#00A0FF',
  blue: '#2040FF',
  violet: '#8000FF',
  magenta: '#FF00FF',
  pink: '#FF60A0',
};
const oklch = converter('oklch');

const hueTable = () =>
  Object.entries(NAMED_COLORS)
    .map(([name, hex]) => `- ${name}: ${Math.round(oklch(hex)?.h ?? 0)}`)
    .join('\n');

/** One line per family: its name and what it is like. */
const fontList = (names: readonly string[]) =>
  names
    .map((name) => {
      const description = googleFont(name)?.description;
      return description ? `- ${name}: ${description}` : `- ${name}`;
    })
    .join('\n');

/** The brief call's system prompt: the hue table and the three font lists. */
export function briefSystemPrompt(): string {
  return fillPrompt(load('./prompt.md'), {
    hues: hueTable(),
    uiFonts: fontList(UI_FONTS),
    displayFonts: fontList(DISPLAY_FONTS),
    monoFonts: fontList(MONO_FONTS),
  });
}

/** The brief call's user message: the idea and the scope. */
export function briefUserMessage(idea: string, scope: Scope): string {
  return fillPrompt(load('./input.md'), {
    idea: stripComments(idea),
    scope: json(scope),
  });
}

/** A review guide beside this file: `review-peer` or `review-output`. */
const guide = (name: string) => fillPrompt(load(`./${name}.md`), {});

/** The call's two review guides (D1.12): the product designer peer, then the output reviewer. */
export const briefReviewGuides = (): ReviewGuides => ({
  peer: guide('review-peer'),
  output: guide('review-output'),
});
