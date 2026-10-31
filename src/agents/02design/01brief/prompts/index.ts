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
  return fillPrompt(load('./prompt.md'), {
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
