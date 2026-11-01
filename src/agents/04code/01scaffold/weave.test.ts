import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { WidgetScreens } from '../../02design/08assemble/assemble';
import { type CodeInputs, issueOwners, sharedUnits, weaveFolders } from './weave';

const golden = (file: string) =>
  JSON.parse(readFileSync(`fixtures/golden/freelancer-workspace/${file}`, 'utf8')).data;
const design = golden('02-design/08-assemble.json') as WidgetScreens;
const inputs: CodeInputs = {
  scope: golden('01-flows/01-scope.json'),
  flows: golden('01-flows/04-reconcile.json'),
  themed: golden('02-design/01-theme.json'),
  contract: golden('03-contract.json'),
  design,
  questions: [{ id: 'Q01', question: 'One workspace per designer?', answer: 'Yes.', from: 'scope' }],
  known: [
    { rule: 'LAYOUT-063', severity: 'mandatory', message: 'two texts', at: 'S22', stage: 'design-assemble' },
    { rule: 'LAYOUT-071', severity: 'mandatory', message: 'too tall', at: 'SH1.r2', stage: 'design-assemble' },
    { rule: 'DESIGN-028', severity: 'mandatory', message: 'wording', at: 'Q99', stage: 'design-assemble' },
  ],
  guidelines: { '01-scaffold': 'Rules for every session.' },
  recipes: '# State and hook recipes\n\n- `createStore`: one shared store.',
};
const files = weaveFolders(inputs);
const read = (file: string) => JSON.parse(files.get(file) ?? 'null');

describe('the .weave folders', () => {
  it('writes every folder, with the guidelines the stages have', () => {
    for (const file of ['01-scaffold/scope.json', '01-scaffold/routes.json', '04-frames/navigation.json', '05-pages/S04/page.json'])
      expect(files.has(file), file).toBe(true);
    expect(files.get('01-scaffold/guidelines.md')).toBe('Rules for every session.');
    expect(files.get('01-scaffold/recipes.md')).toContain('`createStore`');
    expect(read('01-scaffold/issues.json').questions).toEqual(inputs.questions);
  });

  it("gives a page its own nodes and no other page's", () => {
    const page = read('05-pages/S04/page.json');
    const screens = new Set(page.nodes.map((n: { id: string }) => n.id.split('.')[0]));
    expect([...screens]).toEqual(['S04']);
    expect(page.steps.length).toBeGreaterThan(0);
  });

  it('puts what several screens use in 03-shared, and marks it in the pages that use it', () => {
    expect([...sharedUnits(design).widgets].sort()).toEqual(['W01', 'W29']);
    expect([...sharedUnits(design).dialogs]).toEqual(['S17']);
    expect(files.has('03-shared/widgets/W01.json')).toBe(true);
    expect(files.has('03-shared/dialogs/S17.json')).toBe(true);
    const page = read('05-pages/S04/page.json');
    expect(page.placements.find((p: { widget: string }) => p.widget === 'W01')).toMatchObject({ shared: true });
    expect(page.widgets.map((w: { id: string }) => w.id)).not.toContain('W01');
    const s06 = read('05-pages/S06/page.json');
    expect(s06.screens.map((s: { id: string }) => s.id)).not.toContain('S17');
    expect(s06.sharedDialogs).toContain('S17');
  });

  it('sends each known issue to the folder its id names', () => {
    expect(issueOwners('S04.n03', design)).toEqual(['05-pages/S04']);
    expect(issueOwners('S15.n01', design)).toEqual(['05-pages/S06']);
    expect(issueOwners('S17', design)).toEqual(['03-shared']);
    expect(issueOwners('SH1.r2', design)).toEqual(['04-frames']);
    expect(issueOwners('Q99', design)).toEqual(['01-scaffold']);
    expect(read('04-frames/issues.json').known.map((i: { rule: string }) => i.rule)).toEqual(['LAYOUT-071']);
    expect(read('01-scaffold/issues.json').known.map((i: { rule: string }) => i.rule)).toEqual(['DESIGN-028']);
  });
});
