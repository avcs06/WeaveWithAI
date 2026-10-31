import { describe, expect, it } from 'vitest';
import { flows, plan, planCall, scope } from '../__fixtures__/chain';
import { planAsIa, processPlan } from './process';

const screen = (id: string) => {
  const found = plan.screens.find((s) => s.id === id);
  if (!found) throw new Error(`the plan has no ${id}`);
  return found;
};

describe('processPlan', () => {
  it("fills access and roles from the flows each screen serves, a subflow's step by the flow that calls it", () => {
    expect([screen('S02').access, screen('S04').access]).toEqual(['public', 'signedIn']);
    // S07 serves STD01.S01 of the delete subflow F05 calls, and F05's alternatives.
    expect(screen('S07')).toMatchObject({ access: 'signedIn', roles: ['reader'] });
  });

  it("adds the states the steps require to the architect's extras", () => {
    // Listing books needs empty and error; loading is the design system's.
    expect(screen('S04').states).toEqual(['empty', 'error']);
    // A book that is gone shows its own state.
    expect(screen('S06').states).toEqual(['notFound']);
    // Saving fields needs none: a field's error and the submit are the design system's, its result a toast,
    // so sign in's denied alternative F02.A02, which branches from a submit, shows no state either.
    expect(screen('S05').states).toEqual([]);
    expect(screen('S02').states).toEqual([]);
  });

  it('puts each alternative on every screen that serves its step, or only on the screen the architect names', () => {
    expect(screen('S04').flowSteps).toContain('F04.A01');
    expect(planCall.alternativesElsewhere).toContainEqual({ alternative: 'F05.A01', screen: 'S06' });
    expect(screen('S06').flowSteps).toContain('F05.A01');
    expect(screen('S04').flowSteps).not.toContain('F05.A01');
  });

  it("labels each navigation item with its page's title and gives it the page's access", () => {
    expect(plan.navigation).toEqual([
      { screen: 'S04', slot: 'header.end', label: 'Your shelf', access: 'signedIn' },
      { screen: 'S02', slot: 'header.end', label: 'Sign in', access: 'public' },
    ]);
  });

  it('stays the same for the same input', () => {
    expect(processPlan(planCall, flows, scope)).toEqual(plan);
  });
});

describe('planAsIa', () => {
  it("leaves a page's spacing to its layout and gives a dialog its own, with no sections yet", () => {
    const ia = planAsIa(plan);
    expect(ia.screens.find((s) => s.id === 'S04')?.layout).toMatchObject({ gap: '', padding: '' });
    expect(ia.screens.find((s) => s.id === 'S05')?.layout).toMatchObject({ gap: '5', padding: '0' });
    expect(ia.sections).toEqual([]);
    expect(ia.newComponents.map((c) => c.name)).toEqual(['TitleCover']);
  });
});
