import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { designMutations, handBroken } from '../__fixtures__/mutations';
import type { Inventory } from '../../../ds/inventory';
import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Theme } from '../02theme/build';
import { makeScreensSchema, type Screens } from '../schema';
import type { DesignContext } from './helpers';
import {
  iaRules,
  nodeRules,
  screensRules,
  validateIa,
  validateScreenNodes,
  validateScreens,
} from './index';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;

const inventory = read('../../../ds/__fixtures__/inventory.json') as Inventory;

const schema = makeScreensSchema(inventory).Screens;

// Parsing through the schema also proves the fixture and its mutations are valid screens.
const screens = schema.parse(
  read('../__fixtures__/reading-list.screens.json'),
) as Screens;

const ruleIds = (issues: { rule: string }[]) =>
  issues.map((issue) => issue.rule);

const context: Omit<DesignContext, 'shells'> = {
  scope: read('../../01flows/__fixtures__/reading-list.scope.json') as Scope,
  flows: read('../../01flows/__fixtures__/reading-list.flows.json') as Flows,
  inventory,
  defaults: (read('../__fixtures__/reading-list.theme.json') as Theme).defaults,
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

  it("DESIGN-002 fails a look the component lacks, and leaves a component's own height to the design system", () => {
    const fixed = structuredClone(screens);
    const save = fixed.nodes.find((node) => node.id === 'S05.n06');
    if (!save) throw new Error('fixture changed');
    save.box = { ...save.box, height: 'fixed', heightPx: 48 };
    expect(design(fixed)).toEqual([]);
    Object.assign(save, {
      look: 'outline',
      overrideReason: 'An outlined save.',
    });
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
    unframed.nodes = unframed.nodes.filter(
      (node) => !node.id.startsWith('SH1.'),
    );
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
