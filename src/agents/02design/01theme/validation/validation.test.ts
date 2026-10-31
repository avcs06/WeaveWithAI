import { describe, expect, it } from 'vitest';
import { runRules } from '../../../../core/rules';
import type { Scope } from '../../../01flows/01scope/schema';
import { brief, inventory, scope, themeCall } from '../../__fixtures__/chain';
import { briefMutations } from '../../__fixtures__/mutations';
import { Brief, type ThemeCall } from '../schema';
import { briefRules, validateTheme } from './validation';

const ruleIds = (issues: { rule: string }[]) =>
  issues.map((issue) => issue.rule);

describe('the theme call', () => {
  it('passes every rule on the reading-list answer, warnings included', () => {
    expect(validateTheme(themeCall, scope, inventory)).toEqual([]);
  });

  it('THEME-010 wants each mode of the color scheme once, and a set for each colored entity in each', () => {
    const at = (change: (call: ThemeCall) => void) => {
      const call = structuredClone(themeCall);
      change(call);
      return validateTheme(call, scope, inventory)
        .filter((i) => i.rule === 'THEME-010')
        .map((i) => i.at);
    };
    expect(at((c) => (c.brief.colorScheme = 'dark'))).toEqual(['colors.light']);
    expect(at((c) => (c.colors = c.colors.filter((m) => m.mode === 'light')))).toEqual(['colors.dark']);
    expect(at((c) => (c.colors[0]!.entities = []))).toEqual(['colors.light.entities']);
    expect(at((c) => c.colors[1]!.entities.push({ noun: 'Book', steps: c.colors[1]!.entities[0]!.steps }))).toEqual(['colors.dark.entities']);
  });
});

describe('brief rules', () => {
  const check = (b: typeof brief, s: Scope = scope) => runRules(briefRules, { brief: b, scope: s });

  it('the reading-list brief passes, and the schema takes fonts only from the catalog lists', () => {
    expect(check(brief)).toEqual([]);
    const pick = (family: string) => [{ family, reason: 'x' }];
    expect(
      Brief.safeParse({
        ...brief,
        fonts: { ...brief.fonts, mono: pick('Inter') },
      }).success,
    ).toBe(false);
    expect(
      Brief.safeParse({
        ...brief,
        fonts: { ...brief.fonts, display: pick('Comic Sans MS') },
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

  it('BRIEF-001 checks the base and frame hues, and counts personality and feel words and colored entities', () => {
    expect(ruleIds(check({ ...brief, baseHue: -10 }))).toEqual(['BRIEF-001']);
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
