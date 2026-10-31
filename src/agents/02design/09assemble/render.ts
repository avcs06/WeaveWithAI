import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Brief } from '../01brief/schema';
import type { DesignNode, DesignScreen, DesignSection, NewComponent, Screens } from '../schema';
import type { NodeLayout, Shell } from '../schema-boxes';
import type { PageLayout } from '../02theme/schema';
import type { Mode, Theme } from '../02theme/build';

// 02-design/09-assemble.md (DS8): everything a reviewer needs to read a design without
// the JSON: the direction, the palette with its contrast, the shells and the
// navigation, each screen's sections and nodes as a tree, the new components. The
// wireframes (02-design/09-wireframes.html, DS6b) draw the same screens.

const byOrder = <T extends { order: number; id: string }>(a: T, b: T) =>
  a.order - b.order || a.id.localeCompare(b.id);

const layoutTag = (layout: NodeLayout) =>
  [
    layout.direction,
    layout.direction === 'grid' ? `${layout.columns} columns` : '',
    `gap ${layout.gap}`,
    layout.padding === '0' ? '' : `padding ${layout.padding}`,
    layout.align === 'start' ? '' : `align ${layout.align}`,
    layout.justify === 'start' ? '' : `justify ${layout.justify}`,
    layout.wrap ? 'wraps' : '',
  ]
    .filter(Boolean)
    .join(' ');

const boxTag = (node: DesignNode) => {
  const { box } = node;
  const parts = [
    box.width === 'fixed'
      ? `${box.widthPx} wide`
      : box.width === 'fill'
        ? 'fills'
        : '',
    box.height === 'fixed' ? `${box.heightPx} tall` : '',
    box.minHeightPx ? `at least ${box.minHeightPx} tall` : '',
    box.span > 1 ? `spans ${box.span}` : '',
  ];
  return parts.filter(Boolean).join(', ');
};

/** `[Button md ghost · secondary-action] Sign out → S01 (F06.S01) (fills; states: default, submitting)`. */
function nodeLine(node: DesignNode): string {
  const what = node.newComponent
    ? `new ${node.newComponent}`
    : node.component !== 'none'
      ? [node.component, node.size, node.look].filter(Boolean).join(' ')
      : node.headingLevel
        ? `h${node.headingLevel} ${node.typeScale}`
        : node.typeScale !== 'none'
          ? `${node.role} ${node.typeScale}`
          : node.role;
  const tags = [
    what,
    node.layout ? layoutTag(node.layout) : '',
    node.headingLevel || node.typeScale !== 'none' ? '' : node.role,
  ]
    .filter((tag, i, all) => tag && all.indexOf(tag) === i)
    .join(' · ');
  // Without visible copy, what the node is says more than its role.
  const text = node.text
    ? ` ${node.text}`
    : node.label
      ? ` "${node.label}"`
      : ` ${node.what}`;
  const target = node.navigatesTo ? ` → ${node.navigatesTo}` : '';
  const steps = node.flowSteps.length ? ` (${node.flowSteps.join(', ')})` : '';
  const extra = [
    boxTag(node),
    node.field ? `field ${node.field}` : '',
    node.data.length ? `data ${node.data.join(', ')}` : '',
    node.states.length && node.states.join() !== 'default'
      ? `states ${node.states.join(', ')}`
      : '',
    node.overrideReason ? `over the defaults: ${node.overrideReason}` : '',
  ].filter(Boolean);
  return `[${tags}]${text}${target}${steps}${extra.length ? ` (${extra.join('; ')})` : ''} \`${node.id}\``;
}

function tree(
  nodes: DesignNode[],
  section: string,
  parent: string,
  depth: number,
): string[] {
  return nodes
    .filter((node) => node.section === section && node.parent === parent)
    .sort(byOrder)
    .flatMap((node) => [
      `${'  '.repeat(depth)}- ${nodeLine(node)}`,
      ...tree(nodes, section, node.id, depth + 1),
    ]);
}

function sectionLines(section: DesignSection, nodes: DesignNode[]): string[] {
  const size =
    section.box.width === 'fixed' ? `, ${section.box.widthPx} wide` : '';
  const surface =
    section.surface === 'page' ? '' : `, on the ${section.surface} surface`;
  return [
    `### ${section.id} ${section.title} (${section.kind}, ${layoutTag(section.layout)}${size}${surface})`,
    '',
    section.purpose,
    '',
    ...tree(nodes, section.id, '', 0),
    '',
  ];
}

function shellLines(shell: Shell, screens: Screens): string[] {
  const pages = screens.screens.filter((s) => s.shell === shell.id);
  return [
    `### ${shell.id} ${shell.name}`,
    '',
    `${shell.purpose} Frames ${pages.map((s) => s.id).join(', ') || 'no page'}.`,
    '',
    ...shell.regions.flatMap(({ id, place, overlay, box, layout, holds }) => {
      const size =
        place === 'left' || place === 'right'
          ? `${box.widthPx} wide`
          : box.height === 'fixed'
            ? `${box.heightPx} tall`
            : 'content height';
      const over = overlay ? ', over the page' : '';
      return [
        `- ${id} ${place}${over}, ${size}, ${layoutTag(layout)}: ${holds}`,
        ...tree(screens.nodes, id, '', 1),
      ];
    }),
    '',
  ];
}

function screenLines(screen: DesignScreen, screens: Screens): string[] {
  const where =
    screen.type === 'page'
      ? screen.route
      : `${screen.type} of ${screen.parent}`;
  const access =
    screen.access === 'public'
      ? 'public'
      : `signed in${screen.roles.length ? ` (${screen.roles.join(', ')})` : ''}`;
  const facts = [
    where,
    `${screen.kind} screen`,
    screen.type === 'page' ? `shell ${screen.shell || 'none'}` : '',
    `${screen.contentWidth} width`,
    access,
    screen.entry ? 'entry' : '',
  ].filter(Boolean);
  return [
    `## ${screen.id} ${screen.name}`,
    '',
    facts.join(' · '),
    '',
    screen.purpose,
    '',
    `States: ${screen.states.join(', ')}. Serves: ${screen.flowSteps.join(', ') || 'no flow step'}. Sections: ${layoutTag(screen.layout)}.`,
    '',
    ...screens.sections
      .filter((section) => section.screen === screen.id)
      .sort(byOrder)
      .flatMap((section) => sectionLines(section, screens.nodes)),
  ];
}

/** One table per mode: each role, its hex, and the contrast of the pairs it is the text or edge of. */
function swatches(
  name: string,
  set: (mode: Mode) => Record<string, string> | undefined,
  theme: Theme,
): string[] {
  return theme.modes.flatMap((mode) => [
    `### ${name}, ${mode}`,
    '',
    '| Role | Hex | Contrast |',
    '| ---- | --- | -------- |',
    ...Object.entries(set(mode) ?? {}).map(([role, hex]) => {
      const pairs = theme.contrast
        .filter(
          (row) =>
            row.set === name &&
            row.mode === mode &&
            row.pair.startsWith(`${role} on `),
        )
        .map((row) => `${row.ratio}:1 ${row.pair.slice(role.length + 1)}`);
      return `| ${role} | \`${hex}\` | ${pairs.join(', ')} |`;
    }),
    '',
  ]);
}

/** A layout in one line: what docks first, the container, then each needed part. */
function layoutLine(kind: string, layout: PageLayout): string {
  const { header, sidebar, extraSidebar, footer, main } = layout;
  const scroll = (sticky: boolean) => (sticky ? 'sticky' : 'scrolls');
  const parts = [
    header.needed &&
      `header ${scroll(header.sticky)}${header.overlay ? ', over the hero' : ''}, ${header.separation}`,
    ...[sidebar, extraSidebar].map(
      (side) =>
        side.needed &&
        `sidebar ${side.side} ${side.widthPx} wide ${scroll(side.sticky)}, ${side.separation}`,
    ),
    footer.needed && `footer, ${footer.separation}`,
  ].filter(Boolean);
  const container =
    main.container === 'fixed' ? `fixed ${main.maxWidthPx}` : 'fluid';
  return `- ${kind}: ${layout.docksFirst} first; container ${container} ${main.align}, padding ${main.padding}, section gap ${main.sectionGap}${main.fullBleed ? ', full-bleed sections' : ''}${main.separation === 'none' ? '' : `, main ${main.separation}`}; ${parts.join('; ') || 'no frame'}.`;
}

function newComponentLines(component: NewComponent): string[] {
  return [
    `### ${component.name}`,
    '',
    component.purpose,
    '',
    `- Closest existing: ${component.closestExisting.join(', ')}. Why not: ${component.whyNotExisting}`,
    `- Built from: ${component.composedOf.join(', ') || 'nothing named'}.`,
    `- Box: ${component.box.width === 'fixed' ? `${component.box.widthPx} wide` : component.box.width}, ${component.box.height === 'fixed' ? `${component.box.heightPx} tall` : component.box.height}, padding ${component.box.padding}, gap ${component.box.gap}.`,
    `- Parts: ${component.parts.map((part) => `${part.name} (${part.description})`).join('; ') || 'none'}.`,
    `- Layout: ${component.layout}`,
    `- Behavior: ${component.behavior}`,
    `- States: ${component.states.join(', ')}. ARIA pattern: ${component.ariaPattern}. Keyboard: ${component.keyboard.map((k) => `${k.key} ${k.action}`).join('; ') || 'none'}.`,
    `- Used on: ${component.usedOn.join(', ')}.`,
    '',
  ];
}

export function renderDesign(
  brief: Brief,
  theme: Theme,
  screens: Screens,
  flows: Flows,
  scope: Scope,
): string {
  const pages = screens.screens.filter((s) => s.type === 'page');
  const overlays = screens.screens.filter((s) => s.type !== 'page');
  const lines = [
    `# ${scope.app.name}: design`,
    '',
    `Audience: ${brief.audience} Feels ${brief.personality.join(', ')}; copy is ${brief.voice}.`,
    '',
    `- Density ${theme.density}, radius ${theme.radius.surface} surfaces and ${theme.radius.control} controls, focus ring ${theme.focusRing}, imagery ${brief.imagery}.`,
    `- Fonts: ${theme.fonts.ui} for text, ${theme.fonts.display} for headings, ${theme.fonts.mono} for code.`,
    `- Style ${brief.feel.join(' and ')}, ${brief.colorScheme === 'both' ? 'light and dark' : `${brief.colorScheme} only`}; brand hue ${brief.seedHue}, ${brief.seedChroma}; page hue ${brief.pageHue}, ${brief.pageChroma}; frame hue ${brief.frameHue}, ${brief.frameChroma}.${brief.references.length ? ` References: ${brief.references.join(', ')}.` : ''}`,
    '- Wireframes of every screen at desktop width: `02-design/09-wireframes.html`.',
    '',
    '## Palette',
    '',
    ...swatches('page', (mode) => theme.colors[mode]?.page, theme),
    ...swatches('theme', (mode) => theme.colors[mode]?.theme, theme),
    ...swatches('base', (mode) => theme.colors[mode]?.base, theme),
    ...Object.keys(theme.colors[theme.modes[0]!]?.entity ?? {}).flatMap(
      (name) => [
        `Entity set ${name}: ${scope.vocabulary.find((word) => word.noun.toLowerCase() === name.toLowerCase())?.description ?? ''}`,
        '',
        ...swatches(name, (mode) => theme.colors[mode]?.entity[name], theme),
      ],
    ),
    '## Layouts, shells and navigation',
    '',
    layoutLine('app', theme.layouts.app),
    layoutLine('marketing', theme.layouts.marketing),
    '',
    `Component defaults: ${
      Object.entries(theme.defaults)
        .map(
          ([name, values]) =>
            `${name} ${Object.entries(values)
              .map(([prop, value]) => `${prop} ${value || '""'}`)
              .join(', ')}`,
        )
        .join('; ') || 'none'
    }.`,
    '',
    `Navigation: ${screens.navigation.items.map((item) => `${item.label} → ${item.screen} (${item.access})`).join(', ') || 'no items'}.`,
    '',
    ...screens.shells.flatMap((shell) => shellLines(shell, screens)),
    ...[...pages, ...overlays].flatMap((screen) =>
      screenLines(screen, screens),
    ),
  ];
  if (screens.newComponents.length)
    lines.push(
      '## New components',
      '',
      ...screens.newComponents.flatMap(newComponentLines),
    );
  const ids = new Set(flows.flows.flatMap((f) => f.steps.map((s) => s.id)));
  if (screens.questions.length)
    lines.push(
      '## Questions',
      '',
      ...screens.questions.map(
        (q) => `- ${q.id} ${q.question} Default: ${q.defaultAnswer}`,
      ),
      '',
    );
  if (screens.impossibleSteps.length)
    lines.push(
      '## Steps the design cannot serve',
      '',
      ...screens.impossibleSteps.map(
        (s) =>
          `- ${s.step}${ids.has(s.step) ? '' : ' (unknown step)'}: ${s.reason}`,
      ),
      '',
    );
  return `${lines.join('\n').trimEnd()}\n`;
}
