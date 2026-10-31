import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Inventory } from '../../../../ds/inventory';
import { type Rect, skeleton } from './skeleton';
import { layoutShell } from '../../02theme/shells';
import { type DesignNode, type DesignScreen, type DesignSection, makeScreensSchema, type Screens } from '../../schema';
import type { NodeLayout, Region } from '../../schema-boxes';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;
const inventory = read('../../../../ds/__fixtures__/inventory.json') as Inventory;
const fixture = () =>
  makeScreensSchema(inventory).Screens.parse(
    read('../../__fixtures__/reading-list.screens.json'),
  ) as Screens;

const layout = (
  direction: NodeLayout['direction'],
  rest: Partial<NodeLayout> = {},
): NodeLayout => ({
  direction,
  gap: '0',
  padding: '0',
  columns: 0,
  align: 'start',
  justify: 'start',
  wrap: false,
  ...rest,
});
const box = {
  width: 'content',
  widthPx: 0,
  height: 'content',
  heightPx: 0,
  minHeightPx: 0,
  span: 1,
} as const;

let order = 0;
const node = (id: string, rest: Partial<DesignNode> = {}): DesignNode => ({
  id: `S01.${id}`,
  section: 'S01.sec1',
  parent: '',
  order: (order += 1),
  what: id,
  newComponent: '',
  component: 'none',
  size: '',
  look: '',
  overrideReason: '',
  box,
  layout: null,
  typeScale: 'none',
  text: '',
  label: '',
  headingLevel: 0,
  role: 'display',
  field: '',
  data: [],
  flowSteps: [],
  states: ['default'],
  navigatesTo: '',
  ...rest,
  ...(rest.parent && { parent: `S01.${rest.parent}` }),
});

const screen = (rest: Partial<DesignScreen> = {}): DesignScreen => ({
  id: 'S01',
  name: 'Tiny',
  type: 'page',
  route: '/',
  parent: '',
  kind: 'app',
  framed: true,
  shell: 'SH1',
  contentWidth: 'narrow',
  layout: layout('column', { gap: '6', padding: '6' }),
  access: 'public',
  roles: [],
  purpose: '',
  entry: true,
  states: ['default'],
  flowSteps: [],
  ...rest,
});
const section = (rest: Partial<DesignSection> = {}): DesignSection => ({
  id: 'S01.sec1',
  screen: 'S01',
  order: 1,
  kind: 'custom',
  title: 'One',
  purpose: '',
  box: { ...box, width: 'fill' },
  layout: layout('column', { gap: '4' }),
  surface: 'page',
  flowSteps: [],
  ...rest,
});

const region = (
  id: string,
  place: Region['place'],
  size: number,
  rest: Partial<Region> = {},
): Region => {
  const side = place === 'left' || place === 'right';
  return {
    id: `SH1.${id}`,
    place,
    overlay: false,
    box: {
      width: side ? 'fixed' : 'fill',
      widthPx: side ? size : 0,
      height: side ? 'fill' : 'fixed',
      heightPx: side ? 0 : size,
      minHeightPx: 0,
    },
    layout: layout('row', { gap: '4', padding: '3', align: 'center' }),
    holds: id,
    ...rest,
  };
};

const fluid: Screens['containers']['app'] = {
  container: 'fluid',
  maxWidthPx: 0,
  align: 'center',
};

/** One screen with one section holding `nodes` in shell SH1, a top bar 56 tall unless `regions` says otherwise, in a fluid centred container unless `container` says otherwise, solved, by node id. */
function solve(
  nodes: DesignNode[],
  options: {
    screen?: Partial<DesignScreen>;
    section?: Partial<DesignSection>;
    regions?: Region[];
    container?: Screens['containers']['app'];
  } = {},
) {
  const regions = options.regions ?? [region('r1', 'top', 56)];
  const container = options.container ?? fluid;
  const screens: Screens = {
    navigation: { items: [] },
    screens: [screen(options.screen)],
    sections: [section(options.section)],
    newComponents: [],
    questions: [],
    impossibleSteps: [],
    containers: { app: container, marketing: container },
    shells: [{ id: 'SH1', name: 'app', purpose: '', regions }],
    nodes,
  };
  const rects = skeleton(screens, inventory).screens[0]?.rects ?? [];
  return Object.fromEntries(
    rects.map((rect) => [rect.id.replace(/^S01\./, ''), rect]),
  );
}

const at = (rect: Rect | undefined) =>
  rect && [rect.x, rect.y, rect.width, rect.height];

describe('layout skeleton', () => {
  it('solves a hand-computed page to exact rectangles', () => {
    const nodes = [
      node('n01', {
        role: 'heading',
        headingLevel: 1,
        typeScale: 'title',
        text: 'Shelf',
      }),
      node('n02', {
        role: 'container',
        box: { ...box, width: 'fill' },
        layout: layout('row', { gap: '2', align: 'center', justify: 'end' }),
      }),
      node('n03', {
        parent: 'n02',
        component: 'Button',
        size: 'sm',
        text: 'Cancel',
        role: 'secondary-action',
      }),
      node('n04', {
        parent: 'n02',
        component: 'Button',
        size: 'md',
        text: 'Save',
        role: 'primary-action',
      }),
    ];
    // Desktop: top bar 56, page padding 24, a 640 column centred in 1280.
    // Title: 5 chars x 24px x 0.55 = 66 wide, one 32px line. Buttons: text
    // plus padding, Cancel 46.2 + 16, Save 30.8 + 24; the row ends at the
    // column's right edge and centres the sm button in the md's 40.
    const desktop = solve(nodes);
    expect(at(desktop.content)).toEqual([320, 80, 640, 88]);
    expect(at(desktop.sec1)).toEqual([320, 80, 640, 88]);
    expect(at(desktop.n01)).toEqual([320, 80, 66, 32]);
    expect(at(desktop.n02)).toEqual([320, 128, 640, 40]);
    expect(at(desktop.n03)).toEqual([835, 132, 62.2, 32]);
    expect(at(desktop.n04)).toEqual([905.2, 128, 54.8, 40]);
    expect(desktop.n02?.gapBefore).toBe(16);
    expect(desktop.n04?.gapBefore).toBe(8);
    expect(desktop.n01?.heightFrom).toBe('text 1 line');
    expect(desktop.n04?.heightFrom).toBe('inventory Button md');
    expect(at(desktop['SH1.r1'])).toEqual([0, 0, 1280, 56]);
  });

  it('docks shell regions in order, each on the space the ones before it left', () => {
    const title = node('n01', {
      role: 'heading',
      headingLevel: 1,
      typeScale: 'title',
      text: 'Shelf',
    });
    const mark = node('n02', {
      section: 'SH1.top',
      role: 'text',
      typeScale: 'heading',
      text: 'Shelf',
    });
    const rects = solve([title, mark], {
      regions: [
        region('left', 'left', 240),
        region('top', 'top', 56),
        region('right', 'right', 200),
        region('bottom', 'bottom', 48),
      ],
    });
    // The left region runs the whole height; the top bar spans what is left
    // of the width; the right region runs below the bar; the bottom bar sits
    // between the two side regions. The 640 column centres in the 840 left.
    expect(at(rects['SH1.left'])).toEqual([0, 0, 240, 800]);
    expect(at(rects['SH1.top'])).toEqual([240, 0, 1040, 56]);
    expect(at(rects['SH1.right'])).toEqual([1080, 56, 200, 744]);
    expect(at(rects['SH1.bottom'])).toEqual([240, 752, 840, 48]);
    expect(at(rects.content)?.slice(0, 3)).toEqual([340, 80, 640]);
    // A region's nodes sit inside its padding, 12 here.
    expect(rects.n02?.x).toBe(252);
    expect(rects.n02?.parent).toBe('SH1.top');
  });

  it('docks a header-first and a sidebars-first layout, both sidebars and a footer, to known rectangles', () => {
    const title = node('n01', {
      role: 'heading',
      headingLevel: 1,
      typeScale: 'title',
      text: 'Shelf',
    });
    const side = {
      needed: true,
      top: 'the shelves',
      bottom: '',
      sticky: true,
      padding: '3',
      gap: '2',
      separation: 'divider',
    } as const;
    const bar = {
      needed: true,
      start: 'the wordmark',
      center: '',
      end: 'the account menu',
      padding: '3',
      gap: '3',
      separation: 'background',
    } as const;
    const frame = (docksFirst: 'header' | 'sidebars') =>
      layoutShell('SH1', 'app', {
        docksFirst,
        header: { ...bar, heightPx: 56, sticky: true, overlay: false },
        sidebar: { ...side, side: 'left', widthPx: 240 },
        extraSidebar: { ...side, side: 'right', widthPx: 200 },
        footer: { ...bar, heightPx: 48 },
        main: {
          container: 'fluid',
          maxWidthPx: 0,
          padding: '6',
          align: 'center',
          sectionGap: '6',
          fullBleed: false,
          separation: 'none',
        },
      }).regions;
    // Header first: the header and the footer span the width, the sidebars
    // run between them, and the 640 column centres in the 840 left.
    const header = solve([title], { regions: frame('header') });
    expect(at(header['SH1.r1'])).toEqual([0, 0, 1280, 56]);
    expect(at(header['SH1.r2'])).toEqual([0, 752, 1280, 48]);
    expect(at(header['SH1.r3'])).toEqual([0, 56, 240, 696]);
    expect(at(header['SH1.r4'])).toEqual([1080, 56, 200, 696]);
    expect(at(header.content)?.slice(0, 3)).toEqual([340, 80, 640]);
    // Sidebars first: they run the full height, and the header and the
    // footer sit between them.
    const sides = solve([title], { regions: frame('sidebars') });
    expect(at(sides['SH1.r1'])).toEqual([0, 0, 240, 800]);
    expect(at(sides['SH1.r2'])).toEqual([1080, 0, 200, 800]);
    expect(at(sides['SH1.r3'])).toEqual([240, 0, 840, 56]);
    expect(at(sides['SH1.r4'])).toEqual([240, 752, 840, 48]);
    expect(at(sides.content)?.slice(0, 3)).toEqual([340, 80, 640]);
  });

  it('holds the column in a fixed container, which a full page fills and a start-aligned one starts at its padding', () => {
    const title = node('n01', {
      role: 'heading',
      headingLevel: 1,
      typeScale: 'title',
      text: 'Shelf',
    });
    const fixed = {
      container: 'fixed',
      maxWidthPx: 1000,
      align: 'center',
    } as const;
    // A full page in a 1000 container: 1000 less 24 padding a side, centred.
    const full = solve([title], {
      screen: { contentWidth: 'full' },
      container: fixed,
    });
    expect(at(full.content)?.slice(0, 3)).toEqual([164, 80, 952]);
    // A narrow page narrows it to 640, still centred.
    const narrow = solve([title], { container: fixed });
    expect(at(narrow.content)?.slice(0, 3)).toEqual([320, 80, 640]);
    // Aligned to the start, the column starts at the page padding.
    const start = solve([title], {
      container: { ...fixed, align: 'start' },
    });
    expect(at(start.content)?.slice(0, 3)).toEqual([24, 80, 640]);
  });

  it('lets an overlay region take no space, and a page with no shell start at the top', () => {
    const title = node('n01', {
      role: 'heading',
      headingLevel: 1,
      typeScale: 'title',
      text: 'Shelf',
    });
    const over = solve([title], {
      regions: [region('r1', 'top', 64, { overlay: true })],
    });
    expect(at(over['SH1.r1'])).toEqual([0, 0, 1280, 64]);
    expect(over.n01?.y).toBe(24);
    const bare = solve([title], { screen: { shell: '' } });
    expect(bare['SH1.r1']).toBeUndefined();
    expect(bare.n01?.y).toBe(24);
  });

  it('takes heights from the inventory: controls, whole fields and minimums', () => {
    const rects = solve([
      node('n01', { component: 'Button', size: 'sm', text: 'Save' }),
      node('n02', { component: 'Button', size: 'md', text: 'Save' }),
      node('n03', {
        component: 'Input',
        size: 'sm',
        text: 'Email',
        role: 'input',
        box: { ...box, width: 'fill' },
      }),
      node('n04', {
        component: 'SearchInput',
        size: 'sm',
        label: 'Search',
        role: 'input',
      }),
      node('n05', {
        component: 'Textarea',
        size: 'sm',
        text: 'Notes',
        role: 'input',
      }),
      node('n06', {
        component: 'Textarea',
        size: 'sm',
        text: 'Notes',
        role: 'input',
        box: { ...box, minHeightPx: 160 },
      }),
      node('n07', {
        component: 'MultiSelect',
        size: 'sm',
        text: 'Tags',
        role: 'input',
      }),
      node('n08', {
        component: 'MultiSelect',
        size: 'md',
        text: 'Tags',
        role: 'input',
      }),
      node('n09', {
        component: 'Button',
        size: 'sm',
        text: 'Save',
        box: { ...box, height: 'fixed', heightPx: 48 },
      }),
      node('n10', { component: 'Avatar', size: '' }),
    ]);
    const height = (id: string) => [rects[id]?.height, rects[id]?.heightFrom];
    expect(height('n01')).toEqual([32, 'inventory Button sm']);
    expect(height('n02')).toEqual([40, 'inventory Button md']);
    expect(height('n03')).toEqual([80, 'inventory Input sm']);
    expect(height('n04')).toEqual([
      32,
      'inventory SearchInput sm/box (no visible label)',
    ]);
    expect(height('n05')).toEqual([128, 'inventory Textarea sm']);
    expect(height('n06')).toEqual([
      160,
      'inventory Textarea sm, raised to min 160',
    ]);
    expect(height('n07')).toEqual([
      80,
      'inventory MultiSelect sm field, box at least 32',
    ]);
    expect(height('n08')).toEqual([
      88,
      'inventory MultiSelect md field, box at least 40',
    ]);
    // A fixed height on a measured component: the inventory wins (DESIGN-002 warns).
    expect(height('n09')).toEqual([32, 'inventory Button sm']);
    // No size: the component's default size, with its fixed width.
    expect(height('n10')).toEqual([36, 'inventory Avatar md']);
    expect(rects.n10?.width).toBe(36);
    expect(rects.n03?.width).toBe(640);
    expect(rects.n01?.padding).toEqual([6, 8, 6, 8]);
  });

  it('solves the reading-list fixture with no overlapping siblings, the same every time', () => {
    const first = skeleton(fixture(), inventory);
    expect(skeleton(fixture(), inventory)).toEqual(first);
    expect(JSON.stringify(skeleton(fixture(), inventory))).toBe(
      JSON.stringify(first),
    );
    const overlaps: string[] = [];
    for (const { id, rects } of first.screens) {
      expect(
        rects.filter((rect) => rect.overflowX).map((rect) => rect.id),
        id,
      ).toEqual([]);
      // An overlay region sits over the content on purpose.
      const overlays = new Set(
        fixture()
          .shells.flatMap((shell) => shell.regions)
          .filter((r) => r.overlay)
          .map((r) => r.id),
      );
      for (const a of rects)
        for (const b of rects) {
          if (a.id >= b.id || a.parent !== b.parent || a.parent === '')
            continue;
          if (overlays.has(a.id) || overlays.has(b.id)) continue;
          const apart =
            a.x + a.width <= b.x + 0.01 ||
            b.x + b.width <= a.x + 0.01 ||
            a.y + a.height <= b.y + 0.01 ||
            b.y + b.height <= a.y + 0.01;
          if (!apart) overlaps.push(`${a.id} ${b.id}`);
        }
    }
    expect(overlaps).toEqual([]);
    const kinds = new Set(
      first.screens.flatMap((s) => s.rects.map((r) => r.kind)),
    );
    expect([...kinds].sort()).toEqual([
      'component',
      'container',
      'frame',
      'newComponent',
      'section',
      'text',
    ]);
  });

  it('places a grid in columns, clamps a fixed width, overflows a row that cannot fit and wraps a wrapping one', () => {
    const fill = { ...box, width: 'fill' } as const;
    const nodes = [
      node('n01', {
        role: 'container',
        box: fill,
        layout: layout('grid', { columns: 3, gap: '4' }),
      }),
      ...[1, 2, 3].map((i) =>
        node(`n0${i + 1}`, {
          parent: 'n01',
          box: { ...fill, height: 'fixed', heightPx: 100 },
        }),
      ),
      node('n05', {
        box: {
          ...box,
          width: 'fixed',
          widthPx: 800,
          height: 'fixed',
          heightPx: 40,
        },
      }),
      node('n06', {
        role: 'container',
        box: fill,
        layout: layout('row', { gap: '2' }),
      }),
      ...[1, 2, 3].map((i) =>
        node(`n0${i + 6}`, {
          parent: 'n06',
          component: 'Button',
          size: 'md',
          text: 'Save changes',
          box: { ...box, width: 'fixed', widthPx: 220 },
        }),
      ),
      node('n10', {
        role: 'container',
        box: fill,
        layout: layout('row', { gap: '2', wrap: true }),
      }),
      ...[1, 2, 3].map((i) =>
        node(`n${i + 10}`, {
          parent: 'n10',
          component: 'Button',
          size: 'md',
          text: 'Save changes',
          box: { ...box, width: 'fixed', widthPx: 220 },
        }),
      ),
    ];
    // A 640 column at x 320: an 800 fixed width clamps, three 220 buttons do not fit.
    const rects = solve(nodes);
    expect([rects.n02, rects.n03, rects.n04].map((r) => r?.y)).toEqual([
      80, 80, 80,
    ]);
    expect(rects.n03?.x).toBeCloseTo(320 + (640 - 32) / 3 + 16);
    expect(rects.n03?.gapBefore).toBe(16);
    expect(rects.n05?.width).toBe(640);
    expect(rects.n06?.overflowX).toBe(true);
    expect(rects.n09?.x).toBe(320 + 2 * (220 + 8));
    expect(rects.n10?.overflowX).toBe(false);
    expect([rects.n11, rects.n12].map((r) => r?.y)).toEqual([
      rects.n11?.y,
      rects.n11?.y,
    ]);
    expect(rects.n13?.y).toBe((rects.n11?.y ?? 0) + 40 + 8);
    expect(rects.n13?.x).toBe(320);
    expect(rects.n13?.gapBefore).toBe(8);
    expect(rects.n10?.height).toBe(88);
  });

  it('gives dialogs and drawers the inventory width of their Dialog size, a full one the largest', () => {
    const nodes = [
      node('n01', {
        role: 'text',
        typeScale: 'body',
        text: 'One sentence.',
        box: { ...box, width: 'fill' },
      }),
    ];
    const dialog = (
      contentWidth: DesignScreen['contentWidth'],
      type: DesignScreen['type'] = 'dialog',
    ) =>
      solve(nodes, {
        screen: { type, contentWidth, route: '', layout: layout('column') },
      }).S01;
    expect(dialog('narrow')?.width).toBe(400);
    expect(dialog('medium')?.width).toBe(520);
    expect(dialog('wide')?.width).toBe(720);
    expect(dialog('full')?.width).toBe(720);
    const surface = dialog('medium');
    expect(surface?.x).toBe((1280 - 520) / 2);
    const rects = solve(nodes, {
      screen: {
        type: 'dialog',
        contentWidth: 'medium',
        route: '',
        layout: layout('column'),
      },
    });
    // The header, then the body's measured padding: 20 above, 24 at the sides.
    expect(rects.n01?.x).toBe((surface?.x ?? 0) + 24);
    expect(rects.n01?.y).toBe((surface?.y ?? 0) + 56 + 20);
    expect(rects.n01?.width).toBe(520 - 48);
    const drawer = dialog('wide', 'drawer');
    expect([drawer?.x, drawer?.y, drawer?.width, drawer?.height]).toEqual([
      1280 - 720,
      0,
      720,
      800,
    ]);
  });
});
