import { describe, expect, it } from 'vitest';
import { inPath, protectedOf, readPaths } from './session';

describe('path rules', () => {
  it('take route folders such as [clientId] and (routes) literally', () => {
    const folder = 'web/app/(routes)/(app)/clients/[clientId]';
    expect(inPath(`${folder}/page.tsx`, `${folder}/page.tsx`)).toBe(true);
    expect(inPath(`${folder}/components/Notes.tsx`, `${folder}/components/**`)).toBe(true);
    expect(inPath('web/app/(routes)/(app)/clients/c/page.tsx', `${folder}/page.tsx`)).toBe(false);
    expect(protectedOf([`${folder}/page.tsx`], { writes: [`${folder}/page.tsx`] })).toEqual([]);
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
