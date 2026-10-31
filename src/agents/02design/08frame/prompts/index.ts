import type { ReviewGuides } from '../../../../runner/runSpecStage';
import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Inventory } from '../../../../ds/inventory';
import { inventoryProse } from '../../../../ds/prose';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Brief } from '../../01brief/schema';
import type { Theme } from '../../02theme/build';
import { SHELL_IDS } from '../../02theme/shells';
import type { WidgetIa } from '../../03architect/schema';
import { nodeGuide } from '../../07draw/prompts/index';
import { type Kind, look, screenList } from '../../prompts';
import type { Shell } from '../../schema-boxes';

/** A frame call's system prompt for a shell. */
export function frameSystemPrompt(
  shell: string,
  brief: Brief,
  inv: Inventory,
): string {
  return fillPrompt(load('./prompt.md'), {
    shellId: shell,
    nodeGuide: nodeGuide(brief),
    dsProse: inventoryProse(inv),
  });
}

/** A frame call's user message: the shell with its regions and the framed pages of its kind, the navigation, the deck, the screens, the vocabulary and the look. */
export function frameUserMessage(
  id: string,
  ia: WidgetIa,
  shells: Shell[],
  scope: Scope,
  brief: Brief,
  theme: Theme,
): string {
  const kind = (Object.entries(SHELL_IDS).find(
    ([, shell]) => shell === id,
  )?.[0] ?? 'app') as Kind;
  const pages = ia.screens.filter(
    (s) => s.type === 'page' && s.framed && s.kind === kind,
  );
  return fillPrompt(load('./input.md'), {
    target: json({
      shell: shells.find((s) => s.id === id),
      pages: pages.map(({ id: page, name, route, access }) => ({
        id: page,
        name,
        route,
        access,
      })),
    }),
    navigation: json(ia.navigation),
    deck: json(ia.copy),
    screens: json(screenList(ia)),
    vocabulary: json(scope.vocabulary),
    look: json(look(brief, theme, [kind])),
  });
}

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** The output reviewer alone (DS22): the IA's decisions are already reviewed. */
export const frameReviewGuides = (): ReviewGuides => ({
  output: fillPrompt(load('./review-output.md'), {}),
});
