import type { DesignNode, Screens } from '../schema';

/** Each mutation copies the reading-list screens and breaks one layout rule. */
const edit =
  (change: (copy: Screens) => void) =>
  (value: Screens): Screens => {
    const copy = structuredClone(value);
    change(copy);
    return copy;
  };

function find<T extends { id: string }>(items: T[], id: string): T {
  const found = items.find((item) => item.id === id);
  if (!found) throw new Error(`fixture has no ${id}`);
  return found;
}
const node = (s: Screens, id: string) => find(s.nodes, id);
const section = (s: Screens, id: string) => find(s.sections, id);
/** A new node like an existing one, with its own id and changes. */
const add = (
  s: Screens,
  like: string,
  id: string,
  change: Partial<DesignNode>,
) => s.nodes.push({ ...structuredClone(node(s, like)), id, ...change });
const leaf = {
  layout: null,
  newComponent: '',
  states: ['default' as const],
  navigatesTo: '',
  flowSteps: [],
};

export const layoutMutations: Record<string, (screens: Screens) => Screens> = {
  // A heading above the book's two groups, the title row stacked as one, in the column that holds them.
  'LAYOUT-001': edit((s) => {
    add(s, 'S06.n03', 'S06.n30', { parent: '', order: -1 });
    node(s, 'S06.n02').layout!.direction = 'column';
  }),
  'LAYOUT-002': edit((s) => (node(s, 'S06.n17').order = 0)),
  'LAYOUT-003': edit((s) => (node(s, 'S06.n06').layout!.gap = '4')),
  'LAYOUT-004': edit((s) => (node(s, 'S06.n06').layout!.gap = '1')),
  'LAYOUT-005': edit((s) =>
    add(s, 'S04.n05', 'S04.n17', {
      ...leaf,
      section: 'S04.sec2',
      parent: 'S04.n15',
      order: 3,
      look: '',
      text: 'Clear search',
    }),
  ),
  'LAYOUT-006': edit((s) => (section(s, 'S06.sec2').layout.gap = '8')),
  'LAYOUT-010': edit((s) => {
    s.sections.push({
      ...structuredClone(section(s, 'S04.sec2')),
      id: 'S04.sec3',
      order: 3,
      kind: 'cards',
    });
    // Side by side but aligned to the start: each card is as tall as its own text.
    const cards = section(s, 'S04.sec3');
    cards.layout = { ...cards.layout, direction: 'row', align: 'start' };
    for (const [id, min] of [
      ['S04.n17', 120],
      ['S04.n18', 200],
    ] as const)
      add(s, 'S04.n09', id, {
        ...leaf,
        section: 'S04.sec3',
        component: 'Card',
        role: 'display',
        label: '',
        box: {
          width: 'fill',
          widthPx: 0,
          height: 'content',
          heightPx: 0,
          minHeightPx: min,
          span: 1,
        },
      });
  }),
  'LAYOUT-011': edit((s) => (node(s, 'S05.n08').layout!.gap = '3')),
  'LAYOUT-012': edit((s) => (node(s, 'S04.n01').layout!.gap = '3')),
  'LAYOUT-013': edit((s) => {
    section(s, 'S07.sec1').layout.gap = '1';
    add(s, 'S07.n01', 'S07.n04', {
      order: 2,
      text: 'It cannot be undone.',
      data: [],
    });
  }),
  'LAYOUT-014': edit((s) => (section(s, 'S01.sec1').layout.padding = '8')),
  'LAYOUT-015': edit((s) => {
    node(s, 'S06.n05').layout!.padding = '4';
    node(s, 'S06.n06').layout!.padding = '2';
  }),
  'LAYOUT-018': edit((s) => (node(s, 'S05.n05').size = 'sm')),
  'LAYOUT-019': edit((s) => (node(s, 'S01.n03').box.width = 'fill')),
  'LAYOUT-020': edit((s) => {
    add(s, 'S01.n09', 'S01.n24', { order: 4 });
    add(s, 'S01.n13', 'S01.n25', { parent: 'S01.n24' });
  }),
  'LAYOUT-025': edit((s) => (node(s, 'S01.n03').box.widthPx = 1100)),
  'LAYOUT-026': edit((s) => {
    node(s, 'S05.n01').box = {
      ...node(s, 'S05.n01').box,
      width: 'fixed',
      widthPx: 120,
    };
  }),
  'LAYOUT-028': edit((s) => (section(s, 'S01.sec1').box.minHeightPx = 900)),
  'LAYOUT-030': edit((s) => (node(s, 'S01.n16').box.heightPx = 12)),
  'LAYOUT-031': edit((s) => (node(s, 'S01.n07').typeScale = 'display')),
  'LAYOUT-035': edit(
    (s) => (s.nodes = s.nodes.filter((n) => n.id !== 'S04.n12')),
  ),
  'LAYOUT-038': edit((s) => (node(s, 'S06.n14').component = 'Card')),
  'LAYOUT-039': edit((s) =>
    add(s, 'S05.n03', 'S05.n09', {
      ...leaf,
      order: 5,
      component: 'Card',
      role: 'display',
      text: 'Tip',
    }),
  ),
  'LAYOUT-046': edit((s) => {
    node(s, 'S04.n15').layout!.wrap = false;
    node(s, 'S04.n07').box.widthPx = 1200;
  }),
  'LAYOUT-050': edit(
    (s) => (node(s, 'S05.n06').text = 'Save this book to my shelf'),
  ),
  'LAYOUT-055': edit((s) => {
    add(s, 'S04.n09', 'S04.n17', {
      ...leaf,
      component: 'none',
      role: 'container',
      order: 6,
      label: '',
      layout: {
        direction: 'row',
        gap: '2',
        padding: '0',
        columns: 0,
        align: 'center',
        justify: 'end',
        wrap: false,
      },
    });
    for (const [i, label] of ['Open', 'Move', 'Copy', 'Delete'].entries())
      add(s, 'S04.n05', `S04.n${18 + i}`, {
        ...leaf,
        section: 'S04.sec2',
        parent: 'S04.n17',
        order: i + 1,
        component: 'IconButton',
        look: '',
        text: '',
        label,
      });
  }),
  'LAYOUT-060': edit((s) => {
    node(s, 'S04.n05').order = 2;
    node(s, 'S04.n06').order = 1;
  }),
  'LAYOUT-063': edit(
    (s) =>
      (node(s, 'S07.n01').text =
        'This removes “The Left Hand of Darkness” from your shelf. It cannot be undone.'),
  ),
  // The load error above the search row.
  'LAYOUT-065': edit((s) => (node(s, 'S04.n11').order = 0)),
  'LAYOUT-066': edit((s) => (node(s, 'S05.n08').layout!.gap = '1')),
  'LAYOUT-067': edit((s) => (node(s, 'S06.n01').look = 'ghost')),
  'LAYOUT-070': edit((s) => (section(s, 'S01.sec1').layout.padding = '0')),
  'LAYOUT-071': edit((s) => (node(s, 'SH1.n02').size = 'md')),
};
