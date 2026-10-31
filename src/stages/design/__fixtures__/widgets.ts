import { readFileSync } from 'node:fs';
import type { Inventory } from '../../../ds/inventory';
import { depthFirst } from '../widget-nodes';
import { type DesignNode, makeScreensSchema, type Screens } from '../schema';
import type {
  Build,
  ComponentDesign,
  Copy,
  FrameBuild,
  ModelNode,
  WidgetIa,
} from '../schema-widgets';

// The reading-list design as a widget design (DS23), derived from
// reading-list.screens.json so that file stays the one source: one widget per
// section, its nodes renumbered to the widget, every fixed string once in the
// copy deck, a value a node shows as its sample, and the shells' nodes as
// frame builds.

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
export const inventory = read(
  '../../../ds/__fixtures__/inventory.json',
) as Inventory;
export const screens = makeScreensSchema(inventory).Screens.parse(
  read('./reading-list.screens.json'),
) as Screens;

const unique = <T>(list: T[]) => [...new Set(list)];
const shows = (node: DesignNode) => node.data.length > 0;

function kindOf(node: DesignNode, label: boolean): Copy['kind'] {
  if (label) return 'label';
  if (node.role === 'heading')
    return node.headingLevel === 1 ? 'title' : 'heading';
  if (node.role === 'navigation') return 'navigation';
  if (node.role.endsWith('-action')) return 'action';
  if (node.role === 'input') return 'field';
  if (node.states.includes('empty')) return 'empty';
  if (node.states.includes('success')) return 'success';
  if (
    node.states.some((s) => s === 'error' || s === 'denied' || s === 'notFound')
  )
    return 'error';
  return 'text';
}

/** The deck: every fixed text and label once, by first use. */
const copy: Copy[] = [];
const idOf = (text: string, kind: Copy['kind']) => {
  if (!text) return '';
  const found = copy.find((c) => c.text === text);
  if (found) return found.id;
  const id = `C${String(copy.length + 1).padStart(3, '0')}`;
  copy.push({ id, kind, text });
  return id;
};
const textOf = (node: DesignNode) =>
  shows(node) ? '' : idOf(node.text, kindOf(node, false));
const labelOf = (node: DesignNode) => idOf(node.label, kindOf(node, true));
for (const node of screens.nodes) (textOf(node), labelOf(node));

/** A node as its widget or frame call writes it, `ids` renumbering it and its parent. */
const asModel = (node: DesignNode, ids: Map<string, string>): ModelNode => {
  const { section: _section, ...rest } = node;
  return {
    ...rest,
    id: ids.get(node.id) ?? node.id,
    parent: ids.get(node.parent) ?? node.parent,
    text: textOf(node),
    label: labelOf(node),
    sample: shows(node) ? node.text : '',
  };
};

const widgetOf = new Map(
  screens.sections.map((s, i) => [s.id, `W${String(i + 1).padStart(2, '0')}`]),
);
const nodesOf = (section: string) =>
  screens.nodes.filter((n) => n.section === section);
const headingOf = (section: string) =>
  nodesOf(section)
    .filter((n) => n.headingLevel > 0)
    .sort((a, b) => a.headingLevel - b.headingLevel)[0];

const EDGE: Partial<Record<string, Build['edge']>> = {
  hero: 'band',
  'side-panel': 'surface',
  table: 'bordered',
};

export const builds: Build[] = screens.sections.map((section) => {
  const widget = widgetOf.get(section.id) ?? '';
  const own = depthFirst(nodesOf(section.id));
  const ids = new Map(
    own.map((n, i) => [n.id, `${widget}.n${String(i + 1).padStart(2, '0')}`]),
  );
  return {
    widget,
    edge: EDGE[section.kind] ?? 'text',
    layout: section.layout,
    nodes: own.map((node) => asModel(node, ids)),
    copy: [],
  };
});

export const designs = new Map<string, ComponentDesign>(
  screens.newComponents.map(
    ({
      name,
      purpose: _p,
      closestExisting: _c,
      whyNotExisting: _w,
      usedOn: _u,
      ...design
    }) => [name, design],
  ),
);

const titleOf = (screen: string) => {
  const h1 = screens.nodes.find(
    (n) =>
      n.headingLevel === 1 &&
      screens.sections.some((s) => s.id === n.section && s.screen === screen),
  );
  return h1 && !shows(h1) ? textOf(h1) : '';
};

export const ia: WidgetIa = {
  navigation: {
    items: screens.navigation.items.map((item) => ({
      ...item,
      label: titleOf(item.screen) || idOf(item.label, 'navigation'),
    })),
  },
  copy,
  screens: screens.screens.map(
    ({ layout, flowSteps: _f, shell: _s, ...screen }) => ({
      ...screen,
      arrangement: layout.direction === 'row' ? 'main-side' : 'column',
      title: titleOf(screen.id),
    }),
  ),
  widgets: screens.sections.map((section) => {
    const own = nodesOf(section.id);
    const heading = headingOf(section.id);
    const list = ['list', 'table', 'cards'].includes(section.kind);
    return {
      id: widgetOf.get(section.id) ?? '',
      name: section.title,
      kind: section.kind,
      purpose: section.purpose,
      content: section.purpose,
      title: heading && !shows(heading) ? textOf(heading) : '',
      copy: unique(own.flatMap((n) => [textOf(n), labelOf(n)]).filter(Boolean)),
      flowSteps: unique(own.flatMap((n) => n.flowSteps)),
      fields: unique(own.map((n) => n.field).filter(Boolean)),
      data: unique(own.flatMap((n) => n.data)),
      states: unique(own.flatMap((n) => n.states)).filter(
        (s) => s !== 'default',
      ),
      repeat: list ? (own.flatMap((n) => n.data)[0]?.split('.')[0] ?? '') : '',
      newComponents: unique(own.map((n) => n.newComponent).filter(Boolean)),
    };
  }),
  placements: screens.sections.map((section) => {
    const screen = screens.screens.find((s) => s.id === section.screen);
    return {
      id: section.id,
      screen: section.screen,
      order: section.order,
      widget: widgetOf.get(section.id) ?? '',
      area:
        screen?.layout.direction === 'row' && section.box.width === 'fixed'
          ? 'side'
          : 'main',
      surface: section.surface,
      headingLevel: headingOf(section.id)?.headingLevel ?? 0,
    };
  }),
  newComponents: screens.newComponents.map(
    ({ name, purpose, closestExisting, whyNotExisting }) => ({
      name,
      purpose,
      closestExisting,
      whyNotExisting,
    }),
  ),
  questions: screens.questions,
  impossibleSteps: screens.impossibleSteps,
};

/** A frame's link to a navigation item's page says the item's label, the page's title (DESIGN-028). */
const linkText = (node: DesignNode) =>
  node.role === 'navigation'
    ? ia.navigation.items.find((i) => i.screen === node.navigatesTo)?.label
    : undefined;

export const frames: FrameBuild[] = screens.shells.map((shell) => {
  const regions = new Set(shell.regions.map((r) => r.id));
  return {
    screen: shell.id,
    nodes: screens.nodes
      .filter((n) => regions.has(n.section))
      .map((node) => {
        const model = asModel(node, new Map());
        return {
          ...model,
          text: linkText(node) ?? model.text,
          section: node.section,
        };
      }),
    copy: [],
  };
});
