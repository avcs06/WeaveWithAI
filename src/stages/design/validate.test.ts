import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Inventory } from '../../ds/inventory';
import type { Flows, Scope } from '../flows/schema';
import { layoutMutations } from './__fixtures__/layout-mutations';
import {
  briefMutations,
  designMutations,
  handBroken,
} from './__fixtures__/mutations';
import { skeleton } from './layout';
import { Brief, makeScreensSchema, type Screens } from './schema';
import type { Theme } from './theme';
import {
  briefRules,
  type DesignContext,
  iaRules,
  layoutRules,
  nodeRules,
  screensRules,
  validateBrief,
  validateIa,
  validateLayout,
  validateScreenNodes,
  validateScreens,
} from './validate';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;
const inventory = read('../../ds/__fixtures__/inventory.json') as Inventory;
const schema = makeScreensSchema(inventory).Screens;
// Parsing through the schema also proves the fixture and its mutations are valid screens.
const screens = schema.parse(
  read('./__fixtures__/reading-list.screens.json'),
) as Screens;
const layout = (s: Screens) =>
  validateLayout(schema.parse(s) as Screens, skeleton(s, inventory), inventory);
const ruleIds = (issues: { rule: string }[]) =>
  issues.map((issue) => issue.rule);

describe('layout rules on the reading-list fixture', () => {
  it('passes every layout rule, warnings included', () => {
    expect(layout(screens)).toEqual([]);
  });

  it('LAYOUT-010 finds the repeated items beside a heading and wants one gap of 8 to 16 between cards', () => {
    const cards = layoutMutations['LAYOUT-010']!(screens);
    for (const card of cards.nodes.filter((n) => n.section === 'S04.sec5'))
      card.box.minHeightPx = 120;
    cards.nodes.push({
      ...structuredClone(cards.nodes.find((n) => n.id === 'S04.n02')!),
      id: 'S04.n17',
      section: 'S04.sec5',
      parent: '',
      order: 0,
    });
    const ids = (s: Screens) =>
      layout(s).filter((issue) => issue.rule === 'LAYOUT-010');
    expect(ids(cards)).toEqual([]);
    cards.sections.find((sec) => sec.id === 'S04.sec5')!.layout.gap = '5';
    expect(ids(cards).map((issue) => issue.at)).toEqual(['S04.sec5']);
  });

  it('LAYOUT-063 checks confirmations only, not a dialog that edits and can also delete', () => {
    const editing = structuredClone(screens);
    editing.nodes.push({
      ...structuredClone(editing.nodes.find((n) => n.id === 'S07.n03')!),
      id: 'S05.n08',
      section: 'S05.sec2',
      order: 0,
    });
    expect(ruleIds(layout(editing))).not.toContain('LAYOUT-063');
  });

  it('pairs each layout rule with exactly one mutation', () => {
    expect(Object.keys(layoutMutations).sort()).toEqual(
      layoutRules.map((rule) => rule.id).sort(),
    );
  });

  it.each(layoutRules.map((rule) => [rule.id, rule.severity] as const))(
    '%s (%s) fires on its mutation and not on the valid fixture',
    (id, severity) => {
      const mutate = layoutMutations[id];
      if (!mutate) throw new Error(`no mutation for ${id}`);
      const issues = layout(mutate(screens)).filter(
        (issue) => issue.rule === id,
      );
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.every((issue) => issue.severity === severity)).toBe(true);
      expect(ruleIds(layout(screens))).not.toContain(id);
    },
  );
});

const context: Omit<DesignContext, 'shells'> = {
  scope: read('../flows/__fixtures__/reading-list.scope.json') as Scope,
  flows: read('../flows/__fixtures__/reading-list.flows.json') as Flows,
  inventory,
  defaults: (read('./__fixtures__/reading-list.theme.json') as Theme).defaults,
};
/** Every design rule: the IA, each screen's and shell's nodes, then the whole artifact. */
const design = (s: Screens) => {
  const { nodes, shells, ...ia } = schema.parse(s) as Screens;
  const ctx = { ...context, shells };
  const owner = (section: string) =>
    ia.sections.find((sec) => sec.id === section)?.screen ??
    shells.find((shell) => shell.regions.some((r) => r.id === section))?.id;
  return [
    ...validateIa(ia, ctx),
    ...[...ia.screens, ...shells].flatMap(({ id }) =>
      validateScreenNodes(
        id,
        // As the stage passes them: the nodes of one call, by their section's screen or region's shell.
        nodes.filter((node) => owner(node.section) === id),
        ia,
        ctx,
      ),
    ),
    ...validateScreens(s, ctx),
  ];
};
const designIds = [
  ...new Set(
    [...iaRules, ...nodeRules, ...screensRules].map((rule) => rule.id),
  ),
].sort();

describe('design rules on the reading-list fixture', () => {
  it('passes every design rule, warnings included', () => {
    expect(design(screens)).toEqual([]);
  });

  it('pairs each design rule with exactly one mutation; DESIGN-007 is dropped', () => {
    expect(Object.keys(designMutations).sort()).toEqual(designIds);
    expect(designIds).not.toContain('DESIGN-007');
    expect(designIds).toHaveLength(28);
  });

  it.each(designIds)(
    '%s fires on its mutation and not on the valid fixture',
    (id) => {
      const mutate = designMutations[id];
      if (!mutate) throw new Error(`no mutation for ${id}`);
      expect(ruleIds(design(mutate(screens)))).toContain(id);
      expect(ruleIds(design(screens))).not.toContain(id);
    },
  );

  it('the hand-broken screens fail exactly DESIGN-012, DESIGN-010 and DESIGN-005', () => {
    const issues = design(handBroken(screens));
    const mandatory = issues.filter((issue) => issue.severity === 'mandatory');
    expect([...new Set(ruleIds(mandatory))].sort()).toEqual([
      'DESIGN-005',
      'DESIGN-010',
      'DESIGN-012',
    ]);
  });

  it('DESIGN-002 fails a look the component lacks, and leaves a component\'s own height to the design system', () => {
    const fixed = structuredClone(screens);
    const save = fixed.nodes.find((node) => node.id === 'S05.n06');
    if (!save) throw new Error('fixture changed');
    save.box = { ...save.box, height: 'fixed', heightPx: 48 };
    expect(design(fixed)).toEqual([]);
    Object.assign(save, { look: 'outline', overrideReason: 'An outlined save.' });
    expect(design(fixed).map((i) => [i.rule, i.severity])).toEqual([
      ['DESIGN-002', 'mandatory'],
    ]);
  });

  it('counts a shell node on every page that uses the shell, and checks its id against its region', () => {
    const moved = structuredClone(screens);
    const signOut = moved.nodes.find((node) => node.id === 'S04.n05');
    if (!signOut) throw new Error('fixture changed');
    Object.assign(signOut, { id: 'SH1.n03', section: 'SH1.r1', parent: '' });
    // S04 uses SH1 and lists F06.S01, so Sign out in the bar still serves it.
    expect(design(moved)).toEqual([]);
    const away = structuredClone(moved);
    away.screens.find((s) => s.id === 'S04')!.shell = '';
    expect(ruleIds(design(away))).toContain('DESIGN-008');
    const misnamed = structuredClone(moved);
    misnamed.nodes.find((node) => node.id === 'SH1.n03')!.section = 'SH2.r1';
    expect(ruleIds(design(misnamed))).toContain('DESIGN-001');
  });

  it('DESIGN-001 holds a nodes call to the screen it fills, and wants nodes when it has parts', () => {
    const { nodes, shells, ...ia } = screens;
    const ctx = { ...context, shells };
    const own = nodes.filter((node) => node.id.startsWith('S04.'));
    const ids = (screen: string, list: typeof nodes) =>
      validateScreenNodes(screen, list, ia, ctx)
        .filter((issue) => issue.rule === 'DESIGN-001')
        .map((issue) => issue.at);
    expect(ids('S04', own)).toEqual([]);
    expect(ids('S05', own)).toHaveLength(own.length);
    expect(ids('S04', [])).toEqual(['S04']);
    expect(ids('SH1', [])).toEqual(['SH1']);
  });

  it('DESIGN-009 fails at the IA, before any nodes call, when no screen lists a step', () => {
    const { nodes, shells, ...ia } = designMutations['DESIGN-009']!(screens);
    expect(ruleIds(validateIa(ia, { ...context, shells }))).toContain(
      'DESIGN-009',
    );
  });

  it("DESIGN-011 wants a node for each state the IA lists; the IA's list alone shows nothing", () => {
    const gone = structuredClone(screens);
    gone.nodes = gone.nodes.filter((node) => node.id !== 'S06.n12');
    expect(
      design(gone).map((issue) => [issue.rule, issue.at, issue.message]),
    ).toEqual([
      [
        'DESIGN-011',
        'S06',
        'S06 must show notFound, but none of its nodes does; add a node for it.',
      ],
    ]);
  });

  it('DESIGN-015 keeps level-1 headings out of shells, which show beside every page title', () => {
    const titled = structuredClone(screens);
    titled.nodes.find((node) => node.id === 'SH1.n01')!.headingLevel = 1;
    expect(
      design(titled)
        .filter((issue) => issue.rule === 'DESIGN-015')
        .map((issue) => issue.at),
    ).toEqual(['SH1.n01']);
  });

  it('DESIGN-023 fails a framed page whose layout has no frame, and DESIGN-025 a signed-in item drawn only in the public frame', () => {
    const unframed = structuredClone(screens);
    unframed.shells = unframed.shells.filter((shell) => shell.id !== 'SH1');
    unframed.nodes = unframed.nodes.filter((node) => !node.id.startsWith('SH1.'));
    expect(
      design(unframed)
        .filter((issue) => issue.rule === 'DESIGN-023')
        .map((issue) => issue.at),
    ).toEqual(['S04', 'S06']);

    const moved = structuredClone(screens);
    Object.assign(moved.nodes.find((node) => node.id === 'SH1.n02')!, {
      id: 'SH2.n03',
      section: 'SH2.r1',
    });
    expect(
      design(moved)
        .filter((issue) => issue.rule === 'DESIGN-025')
        .map((issue) => issue.at),
    ).toEqual(['S04']);
  });

  it('DESIGN-005 warns on a near match and DESIGN-012 on two primaries in different sections', () => {
    const near = structuredClone(screens);
    near.newComponents[0]!.name = 'Cards';
    near.nodes.find((node) => node.id === 'S06.n13')!.newComponent = 'Cards';
    expect(design(near)).toEqual([
      expect.objectContaining({ rule: 'DESIGN-005', severity: 'warning' }),
    ]);
    const two = structuredClone(screens);
    two.nodes.find((node) => node.id === 'S04.n14')!.role = 'primary-action';
    two.nodes.find((node) => node.id === 'S04.n14')!.states = ['default'];
    expect(design(two).map((i) => [i.rule, i.severity])).toEqual([
      ['DESIGN-012', 'warning'],
    ]);
  });
});

describe('brief rules', () => {
  const brief = Brief.parse(read('./__fixtures__/reading-list.brief.json'));
  const { scope } = context;
  const check = (b: typeof brief, s: Scope = scope) => validateBrief(b, s);

  it('the reading-list brief passes, and the schema takes fonts only from the catalog lists', () => {
    expect(check(brief)).toEqual([]);
    expect(
      Brief.safeParse({ ...brief, fonts: { ...brief.fonts, mono: 'Inter' } })
        .success,
    ).toBe(false);
    expect(
      Brief.safeParse({
        ...brief,
        fonts: { ...brief.fonts, display: 'Comic Sans MS' },
      }).success,
    ).toBe(false);
  });

  it('pairs each brief rule with one mutation', () => {
    expect(Object.keys(briefMutations).sort()).toEqual(
      briefRules.map((rule) => rule.id).sort(),
    );
  });

  it.each(briefRules.map((rule) => rule.id))(
    '%s fires on its mutation and not on the valid brief',
    (id) => {
      const mutate = briefMutations[id];
      if (!mutate) throw new Error(`no mutation for ${id}`);
      expect(ruleIds(check(mutate(brief)))).toContain(id);
      expect(ruleIds(check(brief))).not.toContain(id);
    },
  );

  it('BRIEF-001 checks the page and frame hues, and counts personality and feel words and colored entities', () => {
    expect(ruleIds(check({ ...brief, pageHue: -10 }))).toEqual(['BRIEF-001']);
    expect(ruleIds(check({ ...brief, frameHue: 400 }))).toEqual(['BRIEF-001']);
    expect(ruleIds(check({ ...brief, personality: ['calm', 'quiet'] }))).toEqual(
      ['BRIEF-001'],
    );
    expect(ruleIds(check({ ...brief, feel: [] }))).toEqual(['BRIEF-001']);
    expect(ruleIds(check({ ...brief, feel: ['a', 'b', 'c'] }))).toEqual([
      'BRIEF-001',
    ]);
    const nouns = ['Book', 'Shelf', 'Author', 'Note'];
    const wide: Scope = {
      ...scope,
      vocabulary: nouns.map((noun) => ({
        noun,
        description: 'x',
        belongsTo: 'reader',
      })),
    };
    const colored = (count: number) =>
      nouns.map((noun, i) => ({ noun, colored: i < count, hue: 250 + 30 * i }));
    expect(check({ ...brief, entities: colored(3) }, wide)).toEqual([]);
    expect(ruleIds(check({ ...brief, entities: colored(4) }, wide))).toEqual([
      'BRIEF-001',
    ]);
    const uncolored = [
      { noun: 'Book', colored: false, hue: 999 },
      { noun: 'Shelf', colored: true, hue: 230 },
    ];
    expect(check({ ...brief, entities: uncolored })).toEqual([]);
  });

  it('BRIEF-002 wants each vocabulary noun once and no other', () => {
    const [book, shelf] = brief.entities as [
      (typeof brief.entities)[number],
      (typeof brief.entities)[number],
    ];
    const issues = (entities: typeof brief.entities) =>
      check({ ...brief, entities })
        .filter((issue) => issue.rule === 'BRIEF-002')
        .map((issue) => [issue.rule, issue.at]);
    expect(issues([book, shelf, shelf])).toEqual([['BRIEF-002', 'Shelf']]);
    expect(issues([book, shelf, { ...book, noun: 'Author' }])).toEqual([
      ['BRIEF-002', 'Author'],
    ]);
    expect(issues([book])).toEqual([['BRIEF-002', 'entities']]);
  });

  it('BRIEF-003 keeps colored hues 30 degrees apart around the wheel, and warns on a status band', () => {
    const issues = (b: Partial<typeof brief>) =>
      check({ ...brief, ...b })
        .filter((issue) => issue.rule === 'BRIEF-003')
        .map((issue) => [issue.severity, issue.at]);
    expect(issues({})).toEqual([]);
    const shelf = (hue: number) => ({
      entities: [brief.entities[0]!, { ...brief.entities[1]!, hue }],
    });
    expect(issues({ seedHue: 350, ...shelf(15) })).toEqual([
      ['mandatory', 'Shelf'],
      ['warning', 'Shelf'],
    ]);
    expect(issues({ seedHue: 150 })).toEqual([['warning', 'seedHue']]);
  });
});
