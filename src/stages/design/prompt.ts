import {
  DISPLAY_FONTS,
  googleFont,
  MONO_FONTS,
  UI_FONTS,
} from '../../config/fonts';
import { fillPrompt, loadPrompt, stripComments } from '../../core/prompt';
import type { ReviewGuides } from '../../core/runSpecStage';
import { pathBeside } from '../../core/utils';
import type { Inventory } from '../../ds/inventory';
import { inventoryProse } from '../../ds/prose';
import type { Flows, Scope } from '../flows/schema';
import type { Brief } from './schema';
import { entitySets, modesOf } from './schema-theme';

export const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** One line per family: its name and what it is like. */
const fontList = (names: readonly string[]) =>
  names
    .map((name) => {
      const description = googleFont(name)?.description;
      return description ? `- ${name}: ${description}` : `- ${name}`;
    })
    .join('\n');

/** The brief call's system prompt: the three font lists. */
export function briefSystemPrompt(): string {
  return fillPrompt(load('./prompt-brief.md'), {
    uiFonts: fontList(UI_FONTS),
    displayFonts: fontList(DISPLAY_FONTS),
    monoFonts: fontList(MONO_FONTS),
  });
}

export const json = (value: unknown) =>
  `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;

/** The brief call's user message: the idea and the scope. */
export function briefUserMessage(idea: string, scope: Scope): string {
  return fillPrompt(load('./prompt-brief-input.md'), {
    idea: stripComments(idea),
    scope: json(scope),
  });
}

/** The theme call's system prompt: the brief's modes and colored entities, and the design system as prose. */
export function themeSystemPrompt(brief: Brief, inv: Inventory): string {
  const sets = entitySets(brief);
  return fillPrompt(load('./prompt-theme.md'), {
    modes: modesOf(brief).length === 2 ? 'light and dark' : `${brief.colorScheme} only`,
    entitySets: sets.length
      ? sets.map(({ name, hue }) => `${name} (hue ${hue})`).join(', ')
      : 'none, so `entity` stays empty',
    dsProse: inventoryProse(inv),
  });
}

/** The theme call's user message: the brief, the scope and what each flow is; the frame needs no steps. */
export function themeUserMessage(brief: Brief, scope: Scope, flows: Flows): string {
  return fillPrompt(load('./prompt-theme-input.md'), {
    brief: json(brief),
    scope: json(scope),
    flows: json(
      flows.flows.map(({ id, name, role, category, authKind, goal }) => ({
        id,
        name,
        role,
        category,
        authKind,
        goal,
      })),
    ),
  });
}

/** A review guide beside this file, such as `review-brief-peer`. */
export const guide = (name: string) => fillPrompt(load(`./${name}.md`), {});

/** A call's two review guides (D1.12): the product designer peer, then the output reviewer. */
const reviewGuides = (name: string): ReviewGuides => ({
  peer: guide(`review-${name}-peer`),
  output: guide(`review-${name}-output`),
});

export const briefReviewGuides = (): ReviewGuides => reviewGuides('brief');
export const themeReviewGuides = (): ReviewGuides => reviewGuides('theme');
export const iaReviewGuides = (): ReviewGuides => reviewGuides('ia');
