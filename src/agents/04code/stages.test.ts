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
    expect(sharedSpecs(design)).toMatchObject([{ id: 'shared', writes: ['web/app/components/**', 'web/app/blocks/**'] }]);
    expect(sharedSpecs(design)[0]?.expect?.testIds).toContain('S17.n01');
    const bare = { ...design, newComponents: [], placements: design.placements.slice(0, 1), nodes: [] };
    expect(sharedSpecs(bare)).toEqual([]);
  });

  it("frames: each shell's layout in a route group named after it, and every frame node's test id", () => {
    const [frames] = framesSpecs(design);
    expect(frames?.writes).toEqual(['web/app/(routes)/(app)/layout.tsx', 'web/app/(routes)/(marketing)/layout.tsx', 'web/app/components/**']);
    expect(frames?.expect?.testIds).toContain('SH1.n01');
  });

  it("pages: the navigation's pages first, each in its shell's group, on a route the browser can open", () => {
    const specs = pageSpecs(design, contract);
    expect(specs.slice(0, 2).map((s) => s.id)).toEqual(['page-S04', 'page-S05']);
    expect(specs).toHaveLength(12);
    const s06 = specs.find((s) => s.id === 'page-S06')!;
    expect(s06.writes).toEqual(['web/app/(routes)/(app)/clients/[clientId]/page.tsx', 'web/app/(routes)/(app)/clients/[clientId]/components/**']);
    expect(s06.route).toBe('/clients/client-1');
    expect(s06.expect?.testIds).toContain('S06.n01');
    // S17 opens from S06 and S07, so blocks/ holds it and S06 is not asked for its ids.
    expect(s06.expect?.testIds.some((id) => id.startsWith('S17.'))).toBe(false);
    expect(s06.expect?.testIds.some((id) => id.startsWith('S14.'))).toBe(true);
    expect(specs.find((s) => s.id === 'page-S01')?.writes).toContain('web/app/(routes)/page.tsx');
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
