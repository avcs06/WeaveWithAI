import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { WidgetScreens } from '../02design/08assemble/assemble';
import type { Contract } from '../03contract/schema';
import { sharedSpecs } from './03shared/stage';
import { framesSpecs } from './04frames/stage';
import { concreteRoute, pageFolder, pageSpecs } from './05pages/stage';
import { themeColors } from './rendered';

const golden = (file: string) => JSON.parse(readFileSync(`fixtures/golden/freelancer-workspace/${file}`, 'utf8')).data;
const design = golden('02-design/08-assemble.json') as WidgetScreens;
const contract = golden('03-contract.json') as Contract;

describe('the code stages on the golden freelancer workspace', () => {
  it('shared: one session writing components and blocks, none when nothing is shared', () => {
    expect(sharedSpecs(design)).toMatchObject([{ id: 'shared', writes: ['web/app/components/**', 'web/app/blocks/**', 'web/app/entities/**'] }]);
    expect(sharedSpecs(design)[0]?.expects?.[0]?.testIds).toContain('S17.n01');
    const bare = { ...design, newComponents: [], placements: design.placements.slice(0, 1), nodes: [] };
    expect(sharedSpecs(bare)).toEqual([]);
  });

  it("frames: each shell's layout in a route group named after it, and every frame node's test id", () => {
    const [frames] = framesSpecs(design);
    expect(frames?.writes).toEqual(['web/app/(routes)/(app)/', 'web/app/(routes)/(marketing)/', 'web/app/components/**', 'web/app/entities/**']);
    // No route renders a frame yet, so frames get no browser checks; the pages check them in place.
    expect(frames?.routes).toBeUndefined();
    expect(frames?.expects?.[0]?.testIds).toContain('SH1.n01');
  });

  it('pages: one unit per group of pages that open each other, wave by wave, each page in its shell\'s group on a route the browser can open', () => {
    const specs = pageSpecs(design, contract);
    expect(specs.map((s) => [s.wave, s.id])).toEqual([
      [1, 'pages-S05-S06-S08'],
      [1, 'pages-S10'],
      [1, 'pages-S11-S12'],
      [2, 'pages-S07'],
      [3, 'pages-S04-S09'],
      [4, 'pages-S02-S03'],
      [5, 'pages-S01'],
    ]);
    const clients = specs.find((s) => s.id === 'pages-S05-S06-S08')!;
    expect(clients.screens).toEqual(['S05', 'S06', 'S08']);
    expect(clients.writes).toEqual(expect.arrayContaining(['web/app/(routes)/(app)/clients/[clientId]/', 'web/app/(routes)/(app)/clients/[clientId]/components/**', 'web/app/entities/**']));
    expect(clients.routes).toEqual([
      { url: '/clients', signedIn: true },
      { url: '/clients/client-1', signedIn: true },
      { url: '/projects/project-1', signedIn: true },
    ]);
    const s06 = clients.expects![1]!;
    expect(s06.testIds).toContain('S06.n01');
    // S17 opens from S06 and S07, so blocks/ holds it and S06 is not asked for its ids.
    expect(s06.testIds.some((id) => id.startsWith('S17.'))).toBe(false);
    expect(s06.testIds.some((id) => id.startsWith('S14.'))).toBe(true);
    expect(specs.find((s) => s.id === 'pages-S01')?.writes).toContain('web/app/(routes)/');
    expect(clients.reads?.deny).toEqual(expect.arrayContaining(['packages/**', 'web/app/(routes)/**', '.weave/05-pages/**']));
    expect(clients.reads?.allow).toEqual(
      expect.arrayContaining(['web/app/(routes)/(app)/clients/[clientId]/**', 'web/app/(routes)/(app)/', '.weave/05-pages/S06/**', '.weave/05-pages/S08/**']),
    );
    // The task lists every page of the group with its own command: signed in behind sign-in, as a visitor otherwise.
    expect(clients.task).toContain('S06 (Client detail) at `/clients/[clientId]`');
    expect(clients.task).toContain('`pnpm verify /clients/client-1 --widths 1280 --storage .weave/02-contract/signed-in.json`');
    const auth = specs.find((s) => s.id === 'pages-S02-S03')!;
    expect(auth.routes?.every((route) => !route.signedIn)).toBe(true);
    expect(auth.task).toContain('`pnpm verify /signin --widths 1280`');
  });

  it('opens a route param on its entity, or on demo', () => {
    expect(concreteRoute('/projects/[projectId]', contract)).toBe('/projects/project-1');
    expect(concreteRoute('/bookings/[token]', contract)).toBe('/bookings/demo');
    const signup = design.screens.find((s) => s.id === 'S02')!;
    expect(pageFolder(design, signup)).toBe('web/app/(routes)/signup');
  });

  it("gives the color check the theme's colors and its accents", () => {
    const { theme } = golden('02-design/01-theme.json');
    const colors = themeColors(theme);
    expect(colors.all.has(theme.colors.light.theme.accentBg)).toBe(true);
    expect(colors.accent.has(theme.colors.light.theme.accentBg)).toBe(true);
    expect(colors.accent.has(theme.colors.light.base.bg)).toBe(false);
  });
});
