import {
  COPY_KINDS,
  NEW_COMPONENT_BUDGET,
  SECTION_KINDS,
  SIDE_WIDTH_PX,
} from '../../config/design';
import { fillPrompt } from '../../core/prompt';
import type { ReviewGuides } from '../../core/runSpecStage';
import type { Inventory } from '../../ds/inventory';
import { inventoryProse } from '../../ds/prose';
import type { Flows, Scope } from '../flows/schema';
import { HEADING_SIZES } from './widget-nodes';
import { guide, json, load } from './prompt';
import { SHELL_IDS } from './resolve';
import { placementsOf, stepFields } from './rules/design-helpers';
import type { Brief, NewComponent, Shell } from './schema';
import type { Layouts } from './schema-theme';
import type { WidgetIa } from './schema-widgets';
import type { Theme } from './theme';

// The prompts of the screens part of the design stage (DS23): the IA, a new
// component, a pair of widgets and a frame. A call after the IA gets what it
// builds from: a widget call its widgets' definitions and placements, the
// copy deck and the steps they serve, not the whole flows.

type Kind = keyof Layouts;

/** The IA call's system prompt: the density, the section and copy kinds, the side panel, the design system and the budget. */
export function iaSystemPrompt(brief: Brief, inv: Inventory): string {
  return fillPrompt(load('./prompt-ia.md'), {
    density: brief.density,
    sectionKinds: SECTION_KINDS.map((kind) => `- ${kind}`).join('\n'),
    copyKinds: COPY_KINDS.join(', '),
    sideWidth: String(SIDE_WIDTH_PX),
    dsProse: inventoryProse(inv),
    newComponentBudget: String(NEW_COMPONENT_BUDGET),
  });
}

/** The IA call's user message: the scope, the flows, the brief and the theme's two page layouts. */
export function iaUserMessage(
  scope: Scope,
  flows: Flows,
  brief: Brief,
  layouts: Layouts,
): string {
  return fillPrompt(load('./prompt-ia-input.md'), {
    scope: json(scope),
    flows: json(flows),
    brief: json(brief),
    layouts: json(layouts),
  });
}

/** The node guide the widget and frame prompts share, with each level's heading size. */
function nodeGuide(brief: Brief): string {
  const sizes = (kind: Kind) =>
    HEADING_SIZES[kind].map((size, i) => `H${i + 1} ${size}`).join(', ');
  return fillPrompt(load('./prompt-nodes.md'), {
    voice: brief.voice,
    density: brief.density,
    headingSizes: `on app screens ${sizes('app')}, on marketing pages ${sizes('marketing')}`,
  });
}

/** What the look of a call is: the brief's feel, the theme's defaults and each kind's content area. */
const look = (brief: Brief, theme: Theme, kinds: Kind[]) => ({
  feel: brief.feel,
  personality: brief.personality,
  imagery: brief.imagery,
  defaults: theme.defaults,
  contentArea: Object.fromEntries(
    kinds.map((kind) => [kind, theme.layouts[kind].main]),
  ),
});

/** The screens a node can open. */
const screenList = (ia: WidgetIa) =>
  ia.screens.map(({ id, name, type, kind, route, parent, access }) => ({
    id,
    name,
    type,
    kind,
    route,
    parent,
    access,
  }));

/** Where a widget is placed: each screen, its area, surface and level, and the widgets around it in reading order. */
function placed(ia: WidgetIa, widget: string) {
  return placementsOf(ia, widget).map((p) => {
    const screen = ia.screens.find((s) => s.id === p.screen);
    const around = ia.placements
      .filter((o) => o.screen === p.screen)
      .sort((a, b) => a.order - b.order)
      .map((o) =>
        o.widget === widget
          ? `${o.widget} (this one)`
          : `${o.widget} ${ia.widgets.find((w) => w.id === o.widget)?.name ?? ''}`,
      );
    return {
      screen: screen && {
        id: screen.id,
        name: screen.name,
        type: screen.type,
        kind: screen.kind,
        contentWidth: screen.contentWidth,
        arrangement: screen.arrangement,
        framed: screen.framed,
      },
      area: p.area,
      surface: p.surface,
      headingLevel: p.headingLevel,
      around,
    };
  });
}

/** A component call's system prompt. */
export function componentSystemPrompt(name: string, inv: Inventory): string {
  return fillPrompt(load('./prompt-component.md'), {
    componentName: name,
    dsProse: inventoryProse(inv),
  });
}

/** A component call's user message: its declaration, the widgets that use it and where, the vocabulary and the look. */
export function componentUserMessage(
  name: string,
  ia: WidgetIa,
  scope: Scope,
  brief: Brief,
  theme: Theme,
): string {
  const users = ia.widgets.filter((w) => w.newComponents.includes(name));
  return fillPrompt(load('./prompt-component-input.md'), {
    declaration: json(ia.newComponents.find((c) => c.name === name)),
    widgets: json(users.map((w) => ({ ...w, placements: placed(ia, w.id) }))),
    vocabulary: json(scope.vocabulary),
    look: json({
      feel: brief.feel,
      personality: brief.personality,
      density: brief.density,
      radius: brief.radius,
      imagery: brief.imagery,
      defaults: theme.defaults,
    }),
  });
}

/** A widget call's system prompt for the widgets it builds. */
export function widgetsSystemPrompt(
  ids: string[],
  brief: Brief,
  inv: Inventory,
): string {
  return fillPrompt(load('./prompt-widgets.md'), {
    widgetIds: ids.join(' and '),
    sideWidth: String(SIDE_WIDTH_PX),
    nodeGuide: nodeGuide(brief),
    dsProse: inventoryProse(inv),
  });
}

/**
 * A widget call's user message: the widgets with their placements, the copy
 * deck, the screens, the steps they serve with their fields, the designed
 * components they use, the vocabulary and the look.
 */
export function widgetsUserMessage(
  ids: string[],
  ia: WidgetIa,
  components: NewComponent[],
  flows: Flows,
  scope: Scope,
  brief: Brief,
  theme: Theme,
): string {
  const widgets = ia.widgets.filter((w) => ids.includes(w.id));
  const served = new Set(widgets.flatMap((w) => w.flowSteps));
  const all = [...flows.flows, ...flows.subflows];
  const steps = all.flatMap((flow) =>
    flow.steps.filter((step) => served.has(step.id)),
  );
  const fields = new Set(steps.flatMap((step) => stepFields(flows, step)));
  const kinds = new Set<Kind>(
    widgets.flatMap((w) =>
      placementsOf(ia, w.id).map(
        (p) => ia.screens.find((s) => s.id === p.screen)?.kind ?? 'app',
      ),
    ),
  );
  const uses = new Set(widgets.flatMap((w) => w.newComponents));
  return fillPrompt(load('./prompt-widgets-input.md'), {
    widgets: json(widgets.map((w) => ({ ...w, placements: placed(ia, w.id) }))),
    deck: json(ia.copy),
    screens: json(screenList(ia)),
    steps: json({
      steps,
      alternatives: all.flatMap((flow) =>
        flow.alternatives.filter((alt) => served.has(alt.id)),
      ),
      fields: flows.fields.filter((field) => fields.has(field.id)),
    }),
    components: json(components.filter((c) => uses.has(c.name))),
    vocabulary: json(scope.vocabulary),
    look: json(look(brief, theme, [...kinds])),
  });
}

/** A frame call's system prompt for a shell. */
export function frameSystemPrompt(
  shell: string,
  brief: Brief,
  inv: Inventory,
): string {
  return fillPrompt(load('./prompt-frame.md'), {
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
  return fillPrompt(load('./prompt-frame-input.md'), {
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

/** The output reviewer alone for the calls that build on the IA (DS22): its decisions are already reviewed. */
export const widgetReviewGuides = (): ReviewGuides => ({
  output: guide('review-widgets-output'),
});
export const componentReviewGuides = (): ReviewGuides => ({
  output: guide('review-component-output'),
});
