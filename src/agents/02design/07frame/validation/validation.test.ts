import { describe, expect, it } from 'vitest';
import type { Issue } from '../../../../core/issues';
import { catalog, ctx, frames, plan, theme } from '../../__fixtures__/chain';
import type { Processed as Catalog } from '../../03catalog/process';
import type { FrameBuild } from '../schema';
import { frameStepsOf } from '../stage';
import { validateFrame } from './validation';

const rules = (issues: Issue[]) => [...new Set(issues.map((i) => i.rule))];
const shell = (id: string) => ctx.shells.find((s) => s.id === id)!;
const frame = (id: string): FrameBuild => structuredClone(frames.find((f) => f.screen === id)!);
const check = (f: FrameBuild, on: Catalog = catalog) =>
  validateFrame(f, plan, frameStepsOf(plan, on, shell(f.screen)), ctx, theme);

// Signing out moved from the shelf's header to the app bar's frame.
const signOutInFrame = () => {
  const on = structuredClone(catalog);
  on.screens.find((s) => s.screen === 'S04')!.frameSteps = ['F06.S01'];
  return on;
};

describe('the reading-list frames', () => {
  it('pass every frame check, warnings included', () => {
    for (const f of frames) expect(check(f), f.screen).toEqual([]);
  });
});

describe('a frame call', () => {
  it("serves the steps catalog gave the frame of each framed page of the shell's kind", () => {
    expect(frameStepsOf(plan, signOutInFrame(), shell('SH1'))).toEqual(['F06.S01']);
    expect(frameStepsOf(plan, signOutInFrame(), shell('SH2'))).toEqual([]);
  });

  it('fails DESIGN-032 for a frame step none of its nodes serves, and passes once a change adds it', () => {
    const f = frame('SH1');
    expect(check(f, signOutInFrame()).map((i) => [i.rule, i.at])).toEqual([['DESIGN-032', 'SH1']]);
    f.changes.push({
      screen: 'S04',
      add: [
        {
          ...structuredClone(f.nodes[1]!),
          id: 'SH1.S04.n01',
          order: 3,
          role: 'secondary-action',
          text: 'Sign out',
          navigatesTo: '',
          flowSteps: ['F06.S01'],
        },
      ],
      remove: [],
    });
    expect(check(f, signOutInFrame())).toEqual([]);
  });

  it('fails LAYOUT-071 for an md button, 40 tall, in a 64 tall bar with 16 above and below it, and passes at 72', () => {
    const f = frame('SH2');
    f.nodes.find((n) => n.id === 'SH2.n02')!.size = 'md';
    const low = structuredClone(theme);
    low.layouts.marketing.header.heightPx = 64;
    const issues = validateFrame(f, plan, frameStepsOf(plan, catalog, shell('SH2')), ctx, low);
    expect(issues.map((i) => [i.rule, i.at])).toEqual([['LAYOUT-071', 'SH2.r1']]);
    expect(check(f)).toEqual([]);
  });

  it("fails DESIGN-001 for a change of a page the frame does not frame, an added id not like the change's, and a removed node the shell lacks", () => {
    const f = frame('SH1');
    f.changes.push(
      { screen: 'S99', add: [], remove: [] },
      { screen: 'S01', add: [], remove: [] },
      { screen: 'S06', add: [{ ...structuredClone(f.nodes[1]!), id: 'SH1.n09' }], remove: ['SH1.n07'] },
    );
    expect(
      check(f)
        .filter((i) => i.rule === 'DESIGN-001')
        .map((i) => i.at),
    ).toEqual(['SH1', 'SH1', 'SH1.n09', 'SH1.n07']);
    expect(rules(check(f))).toEqual(['DESIGN-001']);
  });
});
