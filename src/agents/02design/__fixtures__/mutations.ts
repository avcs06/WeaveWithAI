import type { Brief } from '../01brief/schema';
import type { DesignNode, Screens } from '../schema';

/** Each mutation copies the reading-list screens and breaks one design rule. */
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
const screen = (s: Screens, id: string) => find(s.screens, id);
const section = (s: Screens, id: string) => find(s.sections, id);
const add = (
  s: Screens,
  like: string,
  id: string,
  change: Partial<DesignNode> = {},
) => s.nodes.push({ ...structuredClone(node(s, like)), id, ...change });
const cover = (s: Screens) => {
  const found = s.newComponents[0];
  if (!found) throw new Error('fixture has no new component');
  return found;
};

export const designMutations: Record<string, (screens: Screens) => Screens> = {
  'DESIGN-001': edit((s) => (node(s, 'S04.n06').id = 'S04-n06')),
  'DESIGN-002': edit((s) => (node(s, 'S05.n05').size = 'lg')),
  'DESIGN-003': edit((s) => (node(s, 'S06.n13').newComponent = 'CoverArt')),
  'DESIGN-004': edit((s) => (cover(s).whyNotExisting = '')),
  'DESIGN-005': edit((s) => (cover(s).name = 'Button')),
  'DESIGN-006': edit((s) => {
    for (const name of [
      'ShelfMeter',
      'ReadingStreak',
      'AuthorChip',
      'YearBand',
      'GenreCloud',
    ])
      s.newComponents.push({ ...structuredClone(cover(s)), name });
  }),
  'DESIGN-008': edit((s) => {
    node(s, 'S04.n06').flowSteps = [];
    node(s, 'S04.n14').flowSteps = [];
  }),
  'DESIGN-009': edit((s) => {
    for (const holder of [
      screen(s, 'S06'),
      section(s, 'S06.sec1'),
      node(s, 'S06.n12'),
    ])
      holder.flowSteps = holder.flowSteps.filter((id) => id !== 'F05.A01');
  }),
  'DESIGN-010': edit((s) => (node(s, 'S05.n01').field = '')),
  'DESIGN-011': edit((s) => {
    screen(s, 'S04').states = ['default', 'loading', 'error'];
    for (const id of ['S04.n12', 'S04.n13', 'S04.n14'])
      node(s, id).states = ['default'];
  }),
  'DESIGN-012': edit((s) => (node(s, 'S04.n05').role = 'primary-action')),
  'DESIGN-013': edit((s) =>
    add(s, 'S01.n06', 'S01.n24', { order: 3, text: 'Learn more' }),
  ),
  'DESIGN-014': edit((s) => {
    for (let i = 10; i < 23; i += 1)
      add(s, 'S05.n02', `S05.n${i}`, { order: i });
  }),
  'DESIGN-015': edit((s) => (node(s, 'S01.n12').headingLevel = 4)),
  'DESIGN-016': edit((s) => (node(s, 'S04.n07').label = '')),
  'DESIGN-017': edit((s) => (node(s, 'S04.n09').navigatesTo = '')),
  'DESIGN-018': edit((s) => (screen(s, 'S04').access = 'public')),
  'DESIGN-019': edit((s) => (node(s, 'S06.n08').data = ['Novel.author'])),
  'DESIGN-020': edit((s) => (node(s, 'S05.n06').text = 'Lorem ipsum')),
  'DESIGN-021': edit((s) => (screen(s, 'S06').flowSteps = [])),
  'DESIGN-022': edit((s) => (node(s, 'S01.n08').layout!.columns = 5)),
  'DESIGN-023': edit((s) => (screen(s, 'S05').framed = true)),
  'DESIGN-024': edit((s) => {
    s.nodes = s.nodes.filter((n) => n.section !== 'SH1.r1');
  }),
  'DESIGN-025': edit((s) => (node(s, 'SH1.n02').role = 'secondary-action')),
  'DESIGN-026': edit((s) => (node(s, 'S05.n06').component = 'none')),
  'DESIGN-027': edit((s) => (node(s, 'SH1.n02').overrideReason = '')),
  'DESIGN-034': edit((s) => (node(s, 'S02.n09').navigatesTo = '')),
  'DESIGN-035': edit((s) => (node(s, 'S06.n01').role = 'secondary-action')),
};

/** The spec's hand-broken screens: two primary actions in a section, a missing required input, a new component named Button. */
export const handBroken = edit((s) => {
  node(s, 'S04.n05').role = 'primary-action';
  s.nodes = s.nodes.filter((n) => n.id !== 'S05.n01');
  cover(s).name = 'Button';
  node(s, 'S06.n13').newComponent = 'Button';
});

const briefEdit =
  (change: (copy: Brief) => void) =>
  (value: Brief): Brief => {
    const copy = structuredClone(value);
    change(copy);
    return copy;
  };

export const briefMutations: Record<string, (brief: Brief) => Brief> = {
  'BRIEF-001': briefEdit((b) => (b.seedHue = 400)),
  'BRIEF-002': briefEdit((b) => (b.entities = b.entities.slice(0, 1))),
  'BRIEF-003': briefEdit((b) => (b.entities[1]!.hue = 210)),
};
