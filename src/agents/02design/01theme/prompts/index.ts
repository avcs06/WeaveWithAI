import { converter } from 'culori';
import {
  fillPrompt,
  json,
  loadPrompt,
  stripComments,
} from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Inventory } from '../../../../ds/inventory';
import { inventoryProse } from '../../../../ds/prose';
import type { ReviewGuides } from '../../../../runner/runSpecStage';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import { DISPLAY_FONTS, googleFont, MONO_FONTS, UI_FONTS } from '../fonts';
import { stepGuide } from '../ramps';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** One reference color per name; the prompt shows its OKLCH hue, so a model that thinks in HSL or names picks the right degrees. */
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

/** The theme call's system prompt: the hue table, the three font lists, how code makes a ramp, and the design system as prose. */
export function themeSystemPrompt(inv: Inventory): string {
  return fillPrompt(load('./prompt.md'), {
    hues: hueTable(),
    uiFonts: fontList(UI_FONTS),
    displayFonts: fontList(DISPLAY_FONTS),
    monoFonts: fontList(MONO_FONTS),
    steps: stepGuide(),
    dsProse: inventoryProse(inv),
  });
}

/** The theme call's user message: the idea, the scope and what each flow is; the frame needs no steps. */
export function themeUserMessage(idea: string, scope: Scope, flows: Flows): string {
  return fillPrompt(load('./input.md'), {
    idea: stripComments(idea),
    scope: json(scope),
    flows: json(
      flows.flows.map(({ id, name, role, kind, noun, authKind, goal }) => ({
        id,
        name,
        role,
        kind,
        noun,
        authKind,
        goal,
      })),
    ),
  });
}

/** A review guide beside this file: `review-peer` or `review-output`. */
const guide = (name: string) => fillPrompt(load(`./${name}.md`), {});

/** The call's two review guides: the product designer peer, then the output reviewer. */
export const themeReviewGuides = (): ReviewGuides => ({
  peer: guide('review-peer'),
  output: guide('review-output'),
});
