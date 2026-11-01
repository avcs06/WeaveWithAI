import type { ReviewGuides } from '../../../../runner/runSpecStage';
import { fillPrompt, json, loadPrompt } from '../../../../core/prompt';
import { pathBeside } from '../../../../core/utils';
import type { Inventory } from '../../../../ds/inventory';
import { inventoryProse } from '../../../../ds/prose';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Brief } from '../../01theme/schema';
import type { Theme } from '../../01theme/build';
import { SHELL_IDS } from '../../01theme/shells';
import type { Processed as Plan } from '../../02architect/process';
import { nodeGuide } from '../../06draw/prompts/index';
import { type Kind, look, screenList } from '../../prompts';
import type { Shell } from '../../schema-boxes';

const load = (file: string) => loadPrompt(pathBeside(import.meta.url, file));

/** A frame call's system prompt, the same for every shell so its prefix is cached. */
export function frameSystemPrompt(brief: Brief, inv: Inventory): string {
  return fillPrompt(load('./prompt.md'), {
    nodeGuide: nodeGuide(brief),
    dsProse: inventoryProse(inv),
  });
}

/** A frame call's user message: the shell with its regions and pages, the steps it serves, the navigation, the screens, the vocabulary and the look. */
export function frameUserMessage(
  id: string,
  plan: Plan,
  frameSteps: string[],
  shells: Shell[],
  scope: Scope,
  brief: Brief,
  theme: Theme,
): string {
  const kind = (Object.entries(SHELL_IDS).find(([, shell]) => shell === id)?.[0] ?? 'app') as Kind;
  const pages = plan.screens.filter((s) => s.type === 'page' && s.framed && s.kind === kind);
  return fillPrompt(load('./input.md'), {
    target: json({
      shell: shells.find((s) => s.id === id),
      pages: pages.map(({ id: page, name, route, access, frame }) => ({ id: page, name, route, access, frame })),
    }),
    steps: json(frameSteps),
    navigation: json(plan.navigation),
    screens: json(screenList(plan)),
    vocabulary: json(scope.vocabulary),
    look: json(look(brief, theme, [kind])),
  });
}

/** A frame call's review guide: the output reviewer alone. */
export const frameReviewGuides = (): ReviewGuides => ({
  output: fillPrompt(load('./review-output.md'), {}),
});
