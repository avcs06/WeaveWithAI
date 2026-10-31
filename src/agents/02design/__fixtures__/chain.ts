import { readFileSync } from 'node:fs';
import type { Inventory } from '../../../ds/inventory';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import { buildTheme } from '../01theme/build';
import { makeThemeSchema } from '../01theme/schema';
import { layoutShells } from '../01theme/shells';
import { processPlan } from '../02architect/process';
import type { Plan } from '../02architect/schema';
import { WIDGET_WIDTHS } from '../03catalog/boxes';
import { processCatalog } from '../03catalog/process';
import type { Catalog } from '../03catalog/schema';
import type { ScreenLayout } from '../04screen/schema';
import type { ComponentDesign } from '../05invent/schema';
import type { Build, ModelNode } from '../06draw/schema';
import type { FrameBuild } from '../07frame/schema';
import type { Chain } from '../08assemble/assemble';
import { depthFirst } from '../08assemble/nodes';
import { sizes } from '../08assemble/skeleton/boxes';
import { type DesignContext, requiredStates } from '../rules/helpers';
import { type DesignNode, makeScreensSchema, type Screens } from '../schema';

// The reading-list design as the chain's calls answer it (DS23), derived from
// reading-list.screens.json so that file stays the one source: the plan from
// its screens, a widget per section, a layout per screen with an instance per
// section, the component's look, a build per widget with its nodes renumbered
// and its words inline, and each shell's nodes as a frame.

const read = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
export const inventory = read('../../../ds/__fixtures__/inventory.json') as Inventory;
export const screens = makeScreensSchema(inventory).Screens.parse(
  read('./reading-list.screens.json'),
) as Screens;
export const flows = read('../../01flows/__fixtures__/reading-list.flows.json') as Flows;
export const scope = read('../../01flows/__fixtures__/reading-list.scope.json') as Scope;
/** The reading-list theme call: the brief, and the values the theme is built from. */
export const themeCall = makeThemeSchema(inventory).parse(read('./reading-list.theme.json'));
export const brief = themeCall.brief;
export const theme = buildTheme(themeCall);
export const ctx: DesignContext = {
  scope,
  flows,
  inventory,
  shells: layoutShells(theme.layouts),
  defaults: theme.defaults,
};

const unique = <T>(list: T[]) => [...new Set(list)];
const shows = (node: DesignNode) => node.data.length > 0;
const nodesOf = (section: string) => screens.nodes.filter((n) => n.section === section);
const widgetOf = new Map(
  screens.sections.map((s, i) => [s.id, `W${String(i + 1).padStart(2, '0')}`]),
);
/** The level of a section's top heading; 0 when it has none. */
const topOf = (section: string) =>
  Math.min(...nodesOf(section).filter((n) => n.headingLevel > 0).map((n) => n.headingLevel), 99) % 99;

/** A page's title: the words of its level-1 heading, unless that shows a record's value. */
const titleOf = (screen: string) => {
  const h1 = screens.nodes.find(
    (n) =>
      n.headingLevel === 1 &&
      screens.sections.some((s) => s.id === n.section && s.screen === screen),
  );
  return h1 && !shows(h1) ? h1.text : '';
};
/** The node that shows a page's title, which takes it from its instance's title slot. */
const titleNode = (node: DesignNode) =>
  node.headingLevel === 1 && !shows(node) && titleOf(node.section.split('.')[0] ?? '') !== '';

/** A node as its call writes it: its words inline, a value as its sample, a heading's level from its widget's top. */
const asModel = (node: DesignNode, ids: Map<string, string>, top: number): ModelNode => {
  const { section: _section, ...rest } = node;
  const slot = titleNode(node) ? 'title' : '';
  return {
    ...rest,
    id: ids.get(node.id) ?? node.id,
    parent: ids.get(node.parent) ?? node.parent,
    text: shows(node) || slot ? '' : node.text,
    sample: shows(node) ? node.text : '',
    slot,
    headingLevel: node.headingLevel > 0 ? node.headingLevel - top + 1 : 0,
  };
};

const alternatives = [...flows.flows, ...flows.subflows].flatMap((f) => f.alternatives);
const isAlternative = new Set(alternatives.map((a) => a.id));
const stepsOf = (screen: Screens['screens'][number]) =>
  screen.flowSteps.filter((id) => !isAlternative.has(id));

export const planCall: Plan = {
  screens: screens.screens.map((screen) => {
    const sections = screens.sections.filter((s) => s.screen === screen.id);
    const required = requiredStates(screen.flowSteps, flows);
    return {
      id: screen.id,
      name: screen.name,
      type: screen.type,
      route: screen.route,
      parent: screen.parent,
      kind: screen.kind,
      framed: screen.framed,
      contentWidth: screen.contentWidth,
      title: screen.type === 'page' ? titleOf(screen.id) : '',
      purpose: screen.purpose,
      entry: screen.entry,
      flowSteps: stepsOf(screen),
      states: screen.states.filter((s) => s !== 'default' && !required.includes(s)),
      composition: sections.map((s) => s.title).join(', then '),
      frame: '',
    };
  }),
  navigation: screens.navigation.items.map((item) => ({ screen: item.screen, slot: 'header.end' })),
  // An alternative shown on one screen that is not every screen serving its step.
  alternativesElsewhere: alternatives.flatMap((alternative) => {
    const on = screens.screens.filter((s) => s.flowSteps.includes(alternative.id));
    const serving = screens.screens.filter((s) => stepsOf(s).includes(alternative.from));
    const same = serving.length === 1 && serving[0]?.id === on[0]?.id;
    return on.length === 1 && !same ? [{ alternative: alternative.id, screen: on[0]?.id ?? '' }] : [];
  }),
  newComponents: screens.newComponents.map(
    ({ name, purpose, closestExisting, whyNotExisting, description }) => ({
      name,
      purpose,
      closestExisting,
      whyNotExisting,
      description,
    }),
  ),
  questions: screens.questions,
  impossibleSteps: screens.impossibleSteps,
};
export const plan = processPlan(planCall, flows, scope);

const px = sizes(inventory, []).spacing;
const REPEATS = new Set(['list', 'table', 'cards']);

export const catalogCall: Catalog = {
  widgets: screens.sections.map((section) => {
    const own = nodesOf(section.id);
    const { min, max } = WIDGET_WIDTHS[section.kind];
    const titled = own.some(titleNode);
    return {
      id: widgetOf.get(section.id) ?? '',
      name: section.title,
      kind: section.kind,
      holds: section.purpose,
      flowSteps: unique(own.flatMap((n) => n.flowSteps)),
      data: unique(own.flatMap((n) => n.data)),
      states: unique(own.flatMap((n) => n.states)).filter((s) => s !== 'default'),
      containsHeading: topOf(section.id) > 0,
      repeat: REPEATS.has(section.kind) ? (own.flatMap((n) => n.data)[0]?.split('.')[0] ?? '') : '',
      newComponents: unique(own.map((n) => n.newComponent).filter(Boolean)),
      slots: titled
        ? [{ name: 'title', kind: 'words' as const, holds: "the page's title", minWidthPx: 160, maxWidthPx: 0 }]
        : [],
      layout: {
        parts: [
          {
            row: 1,
            name: section.title,
            minWidthPx: Math.max(0, min - 2 * px(section.layout.padding)),
            text: 'none' as const,
          },
        ],
        gap: section.layout.gap,
        padding: section.layout.padding,
      },
      maxWidthPx: max,
    };
  }),
  components: screens.newComponents.map(({ name, minWidthPx, maxWidthPx }) => ({
    name,
    minWidthPx,
    maxWidthPx,
    slots: [],
  })),
  screens: screens.screens.map((screen) => ({
    screen: screen.id,
    parts: screens.sections
      .filter((s) => s.screen === screen.id)
      .map((s) => widgetOf.get(s.id) ?? ''),
    frameSteps: [],
  })),
};
export const catalog = processCatalog(catalogCall, flows, px);

export const layouts: ScreenLayout[] = screens.screens.map((screen) => ({
  screen: screen.id,
  boxes: screens.boxes
    .filter((b) => b.screen === screen.id)
    .map((b) => ({
      id: b.id,
      parent: b.parent,
      order: b.order,
      direction: b.layout.direction === 'row' ? 'row' : 'column',
      size: b.box.width,
      share: b.share,
      widthPx: b.box.widthPx,
      align: b.layout.align,
    })),
  instances: screens.sections
    .filter((s) => s.screen === screen.id)
    .map((section, i) => {
      const titled = nodesOf(section.id).some(titleNode);
      return {
        id: `${screen.id}.p${i + 1}`,
        places: widgetOf.get(section.id) ?? '',
        in: section.in,
        order: section.order,
        size: section.box.width,
        share: section.share,
        widthPx: section.box.widthPx,
        height: 'free' as const,
        surface: section.surface,
        headingLevel: topOf(section.id),
        slots: titled ? [{ name: 'title', text: titleOf(screen.id) }] : [],
      };
    }),
}));

export const designs = new Map<string, ComponentDesign>(
  screens.newComponents.map(({ name, box, layout, nodes }) => [
    name,
    { box, layout, nodes: nodes.map((node) => ({ ...node, sample: '', slot: '' })) },
  ]),
);

const EDGE: Partial<Record<string, Build['edge']>> = {
  hero: 'band',
  'side-panel': 'surface',
  table: 'bordered',
};

export const builds: Build[] = screens.sections.map((section) => {
  const widget = widgetOf.get(section.id) ?? '';
  const own = depthFirst(nodesOf(section.id));
  const ids = new Map(own.map((n, i) => [n.id, `${widget}.n${String(i + 1).padStart(2, '0')}`]));
  const top = topOf(section.id);
  return {
    widget,
    edge: EDGE[section.kind] ?? 'text',
    layout: section.layout,
    nodes: own.map((node) => asModel(node, ids, top)),
  };
});

export const frames: FrameBuild[] = screens.shells.map((shell) => {
  const regions = new Set(shell.regions.map((r) => r.id));
  return {
    screen: shell.id,
    nodes: screens.nodes
      .filter((n) => regions.has(n.section))
      .map((node) => ({ ...asModel(node, new Map(), 1), section: node.section })),
    changes: [],
  };
});

export const chain: Chain = { plan, catalog, layouts, designs, builds, frames };
