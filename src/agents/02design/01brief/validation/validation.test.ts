import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { briefMutations } from '../../__fixtures__/mutations';
import type { Inventory } from '../../../../ds/inventory';
import type { Scope } from '../../../01flows/01scope/schema';
import type { Flows } from '../../../01flows/schema';
import type { Theme } from '../../02theme/build';
import type { DesignContext } from '../../rules/helpers';
import { Brief } from '../schema';
import { briefRules, validateBrief } from './validation';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;

const inventory = read(
  '../../../../ds/__fixtures__/inventory.json',
) as Inventory;

const ruleIds = (issues: { rule: string }[]) =>
  issues.map((issue) => issue.rule);

const context: Omit<DesignContext, 'shells'> = {
  scope: read('../../../01flows/__fixtures__/reading-list.scope.json') as Scope,
  flows: read('../../../01flows/__fixtures__/reading-list.flows.json') as Flows,
  inventory,
  defaults: (read('../../__fixtures__/reading-list.theme.json') as Theme)
    .defaults,
};

describe('brief rules', () => {
  const brief = Brief.parse(read('../../__fixtures__/reading-list.brief.json'));
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
    expect(
      ruleIds(check({ ...brief, personality: ['calm', 'quiet'] })),
    ).toEqual(['BRIEF-001']);
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
