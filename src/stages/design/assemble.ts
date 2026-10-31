import { DIALOG_GAP, SIDE_WIDTH_PX } from '../../config/design';
import type { DesignNode, Ia, NewComponent, Screens } from './schema';
import type {
  Build,
  ComponentDesign,
  Copy,
  FrameBuild,
  Placement,
  Widget,
  WidgetIa,
} from './schema-widgets';
import { resolveScreens, SHELL_IDS } from './resolve';
import type { Theme } from './theme';
import { copyText, depthFirst, designNode } from './widget-nodes';

// Screens from widgets, in code (DS23): one section per placement, the
// widget's nodes renumbered to the screen, text from the copy deck, heading
// sizes from their levels, and the page layout from the arrangement. The
// result is the screens artifact every whole-design rule and the solver read.

/** The screens artifact of a widget design: the screens, and the deck, widgets and placements they came from. */
export type WidgetScreens = Screens & {
  copy: Copy[];
  widgets: (Widget & { edge: Build['edge'] | '' })[];
  placements: Placement[];
};

const FILL = {
  width: 'fill',
  widthPx: 0,
  height: 'content',
  heightPx: 0,
  minHeightPx: 0,
  span: 1,
} as const;
const SIDE = { ...FILL, width: 'fixed', widthPx: SIDE_WIDTH_PX } as const;
const STACK = {
  direction: 'column',
  gap: '0',
  padding: '0',
  columns: 0,
  align: 'stretch',
  justify: 'start',
  wrap: false,
} as const;

/** Every component the widgets declare, designed or not yet, with the screens and shells that use it. */
function components(
  ia: WidgetIa,
  designs: Map<string, ComponentDesign>,
  usedOn: (name: string) => string[],
): NewComponent[] {
  const blank: ComponentDesign = {
    composedOf: [],
    box: {
      width: 'content',
      widthPx: 0,
      height: 'content',
      heightPx: 0,
      minHeightPx: 0,
      padding: '0',
      gap: '0',
    },
    parts: [],
    layout: '',
    behavior: '',
    props: [],
    states: [],
    keyboard: [],
    ariaPattern: '',
  };
  return ia.newComponents.map((declared) => ({
    ...declared,
    ...(designs.get(declared.name) ?? blank),
    usedOn: usedOn(declared.name),
  }));
}

/**
 * The widget IA in the shape the IA rules read: a section per placement with
 * the widget's kind, steps and surface, a page's layout from its arrangement,
 * and each declared component used where its widgets are placed.
 */
export function legacyIa(
  ia: WidgetIa,
  designs = new Map<string, ComponentDesign>(),
  layouts = new Map<string, Build['layout']>(),
): Ia {
  const widgets = new Map(ia.widgets.map((w) => [w.id, w]));
  const text = copyText(ia.copy);
  const placed = (screen: string) =>
    ia.placements
      .filter((p) => p.screen === screen)
      .sort((a, b) => a.order - b.order);
  const sections = ia.placements.map((p) => {
    const widget = widgets.get(p.widget);
    return {
      id: p.id,
      screen: p.screen,
      order: p.order,
      kind: widget?.kind ?? 'custom',
      title: text(widget?.title ?? '') || (widget?.name ?? p.widget),
      purpose: widget?.purpose ?? '',
      box: p.area === 'side' ? SIDE : FILL,
      layout: layouts.get(p.widget) ?? STACK,
      surface: p.surface,
      flowSteps: widget?.flowSteps ?? [],
    };
  });
  const screens = ia.screens.map(
    ({ arrangement, title: _title, ...screen }) => {
      const page = screen.type === 'page';
      return {
        ...screen,
        layout: {
          ...STACK,
          direction:
            arrangement === 'main-side'
              ? ('row' as const)
              : ('column' as const),
          align:
            arrangement === 'main-side'
              ? ('start' as const)
              : ('stretch' as const),
          // A page takes its gap and padding from its layout; a dialog pads itself.
          gap: page ? '' : DIALOG_GAP,
          padding: page ? '' : '0',
        },
        flowSteps: [
          ...new Set(
            placed(screen.id).flatMap(
              (p) => widgets.get(p.widget)?.flowSteps ?? [],
            ),
          ),
        ],
      };
    },
  );
  const usedOn = (name: string) => [
    ...new Set(
      ia.placements
        .filter((p) => widgets.get(p.widget)?.newComponents.includes(name))
        .map((p) => p.screen),
    ),
  ];
  return {
    navigation: {
      items: ia.navigation.items.map((item) => ({
        ...item,
        label: text(item.label),
      })),
    },
    screens,
    sections,
    newComponents: components(ia, designs, usedOn),
    questions: ia.questions,
    impossibleSteps: ia.impossibleSteps,
  };
}

/**
 * The screens artifact from the IA, the component designs, every widget's
 * build and every frame's nodes. `origin` maps each screen node id to the
 * widget node it came from, for sending an issue back to its widget call.
 */
export function assembleScreens(
  ia: WidgetIa,
  designs: Map<string, ComponentDesign>,
  builds: Build[],
  frames: FrameBuild[],
  theme: Theme,
): { screens: WidgetScreens; origin: Map<string, string> } {
  const byWidget = new Map(builds.map((b) => [b.widget, b]));
  const deck = [
    ...ia.copy,
    ...builds.flatMap((b) => b.copy),
    ...frames.flatMap((f) => f.copy),
  ];
  const text = copyText(deck);
  const kinds = new Map(ia.screens.map((s) => [s.id, s.kind]));
  const origin = new Map<string, string>();

  const nodes: DesignNode[] = [];
  for (const screen of ia.screens) {
    let count = 0;
    const placements = ia.placements
      .filter((p) => p.screen === screen.id)
      .sort((a, b) => a.order - b.order);
    for (const placement of placements) {
      const build = byWidget.get(placement.widget);
      if (!build) continue;
      const ids = new Map<string, string>();
      for (const from of depthFirst(build.nodes))
        ids.set(from.id, `${screen.id}.n${String(++count).padStart(2, '0')}`);
      for (const from of depthFirst(build.nodes)) {
        const id = ids.get(from.id) ?? from.id;
        origin.set(id, from.id);
        nodes.push(
          designNode(
            from,
            {
              id,
              section: placement.id,
              parent: ids.get(from.parent) ?? from.parent,
            },
            screen.kind,
            text,
          ),
        );
      }
    }
  }
  for (const frame of frames) {
    const kind = frame.screen === SHELL_IDS.marketing ? 'marketing' : 'app';
    for (const from of depthFirst(frame.nodes))
      nodes.push(
        designNode(
          from,
          { id: from.id, section: from.section, parent: from.parent },
          kind,
          text,
        ),
      );
  }

  const layouts = new Map(builds.map((b) => [b.widget, b.layout]));
  const resolved = resolveScreens(legacyIa(ia, designs, layouts), nodes, theme);
  const shells = new Set(resolved.shells.map((s) => s.id));
  const usedOn = (name: string) => [
    ...new Set(
      resolved.nodes
        .filter((n) => n.newComponent === name)
        .map((n) => n.id.split('.')[0] ?? '')
        .filter((id) => kinds.has(id) || shells.has(id)),
    ),
  ];
  return {
    screens: {
      ...resolved,
      newComponents: components(ia, designs, usedOn),
      copy: deck,
      widgets: ia.widgets.map((w) => ({
        ...w,
        edge: byWidget.get(w.id)?.edge ?? '',
      })),
      placements: ia.placements,
    },
    origin,
  };
}
