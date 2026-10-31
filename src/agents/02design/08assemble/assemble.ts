import { DIALOG_GAP } from '../config';
import type { DesignBox, DesignNode, Ia, NewComponent, Screens } from '../schema';
import { planAsIa, type Processed as Plan } from '../02architect/process';
import type { Defined, Processed as Catalog } from '../03catalog/process';
import type { Instance, ScreenLayout } from '../04screen/schema';
import type { ComponentDesign } from '../05invent/schema';
import type { Build, ModelNode } from '../06draw/schema';
import type { FrameBuild } from '../07frame/schema';
import { SHELL_IDS } from '../01theme/shells';
import type { Theme } from '../01theme/build';
import { resolveScreens } from './resolve';
import { AS_WRITTEN, depthFirst, designNode, type InstanceWords } from './nodes';

// The screens from the chain, in code (DS23): each screen's box tree, a
// section per instance in a box, the widget's or component's nodes renumbered
// to the screen, the instances in a slot inside it, the words of every slot,
// heading levels from the instances, the frames with each screen's changes,
// and the copy deck built from every word shown.

/** Everything the chain's calls wrote, processed. */
export type Chain = {
  plan: Plan;
  catalog: Catalog;
  layouts: ScreenLayout[];
  designs: Map<string, ComponentDesign>;
  builds: Build[];
  frames: FrameBuild[];
};

/** One string of the deck code builds; ids by first use. */
export type DeckEntry = { id: string; text: string };

/** The screens artifact, with the deck, the definitions and the instances it came from. */
export type WidgetScreens = Screens & {
  copy: DeckEntry[];
  widgets: (Defined & { edge: Build['edge'] | '' })[];
  placements: { id: string; screen: string; widget: string; instance: string }[];
};

const STACK = {
  direction: 'column',
  gap: '0',
  padding: '0',
  columns: 0,
  align: 'stretch',
  justify: 'start',
  wrap: false,
} as const;

const boxOf = (sized: { size: Instance['size']; widthPx: number; height?: Instance['height'] }) => ({
  width: sized.size,
  widthPx: sized.size === 'fixed' ? sized.widthPx : 0,
  height: sized.height === 'fill' ? ('fill' as const) : ('content' as const),
  heightPx: 0,
  minHeightPx: 0,
  span: 1,
});

/** Every word a screen shows, once, in reading order: the deck the coding stage starts from. */
function deckOf(nodes: DesignNode[]): DeckEntry[] {
  const seen = new Map<string, string>();
  for (const node of nodes)
    for (const text of [node.text, node.label])
      if (text && !seen.has(text))
        seen.set(text, `C${String(seen.size + 1).padStart(3, '0')}`);
  return [...seen].map(([text, id]) => ({ id, text }));
}

export function assembleChain(
  chain: Chain,
  theme: Theme,
): { screens: WidgetScreens; origin: Map<string, string> } {
  const { plan, catalog, layouts, designs, builds, frames } = chain;
  const widgets = new Map(catalog.widgets.map((w) => [w.id, w]));
  const byWidget = new Map(builds.map((b) => [b.widget, b]));
  const ranges = new Map(catalog.components.map((c) => [c.name, c]));
  const declared = new Map(plan.newComponents.map((c) => [c.name, c]));
  const origin = new Map<string, string>();
  const nodes: DesignNode[] = [];
  const sections: Ia['sections'] = [];
  const boxes: DesignBox[] = [];
  const placements: WidgetScreens['placements'] = [];

  for (const screen of plan.screens) {
    const layout = layouts.find((l) => l.screen === screen.id);
    if (!layout) continue;
    const page = screen.type === 'page';
    const gap = page ? theme.layouts[screen.kind].main.sectionGap : DIALOG_GAP;
    let count = 0;
    let reading = 0;
    const nextId = () => `${screen.id}.n${String(++count).padStart(2, '0')}`;
    const slotted = (instance: string, slot: string) =>
      layout.instances
        .filter((i) => i.in === `${instance}/${slot}`)
        .sort((a, b) => a.order - b.order);
    const wordsOf = (instance: Instance): InstanceWords => ({
      level: instance.headingLevel,
      words: new Map(instance.slots.map((s) => [s.name, s.text])),
    });

    /** An instance's nodes under `parent`, its slots holding the instances placed in them. */
    const place = (instance: Instance, section: string, parent: string): void => {
      const build = byWidget.get(instance.places);
      const own: ModelNode[] = build?.nodes ?? [];
      const words = wordsOf(instance);
      // A component placed on its own is one node naming it; its look stays in newComponents.
      let root = parent;
      if (!build && designs.has(instance.places)) {
        root = nextId();
        origin.set(root, instance.places);
        nodes.push({
          id: root,
          section,
          parent,
          order: 0,
          what: `the ${instance.places}`,
          newComponent: instance.places,
          component: 'none',
          size: '',
          look: '',
          overrideReason: '',
          box: boxOf(instance),
          layout: null,
          typeScale: 'none',
          text: '',
          label: '',
          headingLevel: 0,
          role: 'container',
          field: '',
          data: [],
          flowSteps: [],
          states: ['default'],
          navigatesTo: '',
        });
      }
      const ids = new Map<string, string>();
      for (const from of depthFirst(own)) ids.set(from.id, nextId());
      for (const from of depthFirst(own)) {
        const id = ids.get(from.id) ?? from.id;
        origin.set(id, from.id);
        nodes.push(
          designNode(
            from,
            { id, section, parent: ids.get(from.parent) ?? root },
            screen.kind,
            words,
          ),
        );
        if (from.slot)
          for (const child of slotted(instance.id, from.slot))
            place(child, section, id);
      }
    };

    for (const box of layout.boxes)
      boxes.push({
        id: box.id,
        screen: screen.id,
        parent: box.parent,
        order: box.order,
        box: boxOf(box),
        layout: { ...STACK, direction: box.direction, gap, align: box.align },
        share: box.share,
      });
    // Sections in reading order: the box tree depth first.
    const inBox = (parent: string): void => {
      const kids = [
        ...layout.boxes.filter((b) => b.parent === parent).map((b) => ({ order: b.order, box: b.id })),
        ...layout.instances.filter((i) => i.in === parent).map((i) => ({ order: i.order, instance: i })),
      ].sort((a, b) => a.order - b.order);
      for (const kid of kids) {
        if ('box' in kid) {
          inBox(kid.box);
          continue;
        }
        const instance = kid.instance;
        const widget = widgets.get(instance.places);
        const id = `${screen.id}.sec${++reading}`;
        const title = instance.slots.find((s) => s.name === 'title')?.text;
        sections.push({
          id,
          screen: screen.id,
          order: reading,
          kind: widget?.kind ?? 'custom',
          title: title || (widget?.name ?? instance.places),
          purpose: widget?.holds ?? declared.get(instance.places)?.purpose ?? '',
          box: boxOf(instance),
          layout: byWidget.get(instance.places)?.layout ?? STACK,
          surface: instance.surface,
          flowSteps: widget?.flowSteps ?? [],
          in: instance.in,
          share: instance.share,
        });
        placements.push({ id, screen: screen.id, widget: instance.places, instance: instance.id });
        place(instance, id, '');
      }
    };
    inBox('');
  }

  // Frames: the shell's nodes, and the nodes a screen's change adds.
  const frameChanges: Screens['frameChanges'] = [];
  for (const frame of frames) {
    const kind = frame.screen === SHELL_IDS.marketing ? 'marketing' : 'app';
    for (const from of depthFirst(frame.nodes))
      nodes.push(designNode(from, { id: from.id, section: from.section, parent: from.parent }, kind, AS_WRITTEN));
    for (const change of frame.changes) {
      for (const from of depthFirst(change.add))
        nodes.push(designNode(from, { id: from.id, section: from.section, parent: from.parent }, kind, AS_WRITTEN));
      frameChanges.push({ screen: change.screen, add: change.add.map((n) => n.id), remove: change.remove });
    }
  }

  const usedOn = (name: string) => [
    ...new Set(nodes.filter((n) => n.newComponent === name).map((n) => n.id.split('.')[0] ?? '')),
  ];
  const newComponents: NewComponent[] = plan.newComponents.map((declared) => {
    const design = designs.get(declared.name);
    const range = ranges.get(declared.name);
    return {
      ...declared,
      minWidthPx: range?.minWidthPx ?? 0,
      maxWidthPx: range?.maxWidthPx ?? 0,
      box: design?.box ?? { width: 'content', widthPx: 0, height: 'content', heightPx: 0, minHeightPx: 0, padding: '0', gap: '0' },
      layout: design?.layout ?? STACK,
      nodes: (design?.nodes ?? []).map(({ sample: _s, slot: _l, ...node }) => node),
      usedOn: usedOn(declared.name),
    };
  });
  const frameSteps = new Map(catalog.screens.map((s) => [s.screen, s.frameSteps]));
  const base = planAsIa(plan);
  const ia: Ia = {
    ...base,
    screens: base.screens.map((screen) => ({
      ...screen,
      flowSteps: [...new Set([...screen.flowSteps, ...(frameSteps.get(screen.id) ?? [])])],
    })),
    sections,
    newComponents,
  };
  const resolved = resolveScreens(ia, nodes, theme);
  return {
    screens: {
      ...resolved,
      boxes,
      frameChanges,
      copy: deckOf(resolved.nodes),
      widgets: catalog.widgets.map((w) => ({ ...w, edge: byWidget.get(w.id)?.edge ?? '' })),
      placements,
    },
    origin,
  };
}
