import { describe, expect, it } from 'vitest';
import { inPath, protectedOf, readPaths } from './session';

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

  it('flag a test or a protected path as a change a session may not make, and nothing else', () => {
    expect(
      protectedOf([
        'web/app/(routes)/(app)/layout.css.ts',
        'web/app/(routes)/(app)/page.test.tsx',
        'packages/ui/src/x.ts',
        'tools/x.mjs',
        '.weave/x.md',
      ]),
    ).toEqual(['web/app/(routes)/(app)/page.test.tsx', 'tools/x.mjs', '.weave/x.md']);
    // Code writes the frames' layouts; a session may change the design system, the template's page and frame components included.
    expect(
      protectedOf([
        'web/app/(routes)/(app)/layout.tsx',
        'web/app/(routes)/(app)/dashboards/layout.tsx',
        'web/app/components/PageLayout/PageLayout.tsx',
        'web/app/components/PageHeader/PageHeader.tsx',
        'web/app/components/Hero/Hero.css.ts',
        'web/app/components/NotFound/NotFound.tsx',
        'web/app/components/PageLogo/PageLogo.tsx',
        'web/app/components/UserMenu/UserMenu.tsx',
        'web/app/components/AppHeader/AppHeader.tsx',
      ]),
    ).toEqual(['web/app/(routes)/(app)/layout.tsx']);
  });
});

describe('the files a tool log shows read', () => {
  it('takes read tools and the paths in shell commands, relative to the app', () => {
    const log = [
      JSON.stringify({ tool: 'read_file', path: '/app/web/app/entities/client/index.ts' }),
      JSON.stringify({ tool: 'bash', command: "cat packages/ui/src/Dialog/Dialog.tsx; sed -n '1,80p' tokens.ts; ls web/app/\\(routes\\)" }),
      JSON.stringify({ tool: 'write_file', path: '/app/web/app/(routes)/home/page.tsx' }),
      JSON.stringify({ tool: 'bash', command: 'pnpm typecheck 2>&1 | tail -5' }),
    ].join('\n');
    expect(readPaths(log, '/somewhere/app').sort()).toEqual(
      ['packages/ui/src/Dialog/Dialog.tsx', 'tokens.ts', 'web/app/(routes)', 'web/app/entities/client/index.ts'].sort(),
    );
  });
});
