import { describe, expect, it } from 'vitest';
import { inPath, protectedOf } from './session';

describe('path rules', () => {
  it('take route folders such as [clientId] and (routes) literally', () => {
    const folder = 'web/app/(routes)/(app)/clients/[clientId]';
    expect(inPath(`${folder}/page.tsx`, `${folder}/page.tsx`)).toBe(true);
    expect(inPath(`${folder}/components/Notes.tsx`, `${folder}/components/**`)).toBe(true);
    expect(inPath(`${folder}/components`, `${folder}/components/**`)).toBe(true);
    expect(inPath('web/app/(routes)/(app)/clients/c/page.tsx', `${folder}/page.tsx`)).toBe(false);
  });

  it('take a folder/ rule as the files directly in the folder, its styles included, and none of its subfolders', () => {
    const shell = 'web/app/(routes)/(app)/';
    expect(inPath('web/app/(routes)/(app)/layout.tsx', shell)).toBe(true);
    expect(inPath('web/app/(routes)/(app)/layout.css.ts', shell)).toBe(true);
    expect(inPath('web/app/(routes)/(app)/dashboards/page.tsx', shell)).toBe(false);
  });

  it('flag a test, the tools or the config as a change a session may not make, and nothing else', () => {
    expect(
      protectedOf([
        'web/app/(routes)/(app)/layout.css.ts',
        'web/app/(routes)/(app)/page.test.tsx',
        'packages/ui/src/x.ts',
        'tools/x.mjs',
        '.mcp.json',
        '.weave/x.md',
      ]),
    ).toEqual(['web/app/(routes)/(app)/page.test.tsx', 'tools/x.mjs', '.mcp.json']);
    // A session may change, with care, the design system, the entities and the frames' layouts code wrote.
    expect(
      protectedOf([
        'web/app/(routes)/(app)/layout.tsx',
        'web/app/(routes)/(app)/dashboards/layout.tsx',
        'web/app/entities/book/index.ts',
        'web/app/components/PageLayout/PageLayout.tsx',
        'web/app/components/PageHeader/PageHeader.tsx',
        'web/app/components/Hero/Hero.css.ts',
        'web/app/components/NotFound/NotFound.tsx',
        'web/app/components/PageLogo/PageLogo.tsx',
        'web/app/components/UserMenu/UserMenu.tsx',
        'web/app/components/AppHeader/AppHeader.tsx',
      ]),
    ).toEqual([]);
  });
});
