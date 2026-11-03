import { describe, expect, it } from 'vitest';
import { architecture, flows, scope, theme } from '../../02design/__fixtures__/chain';
import { frameSkeletons } from './skeleton';

describe('frame skeletons', () => {
  it('leave the app and the marketing site to the scaffold', () => {
    expect(frameSkeletons(architecture, flows, scope, theme).size).toBe(0);
  });

  it('give a further frame its own layout and parts, signed in when its screens are', () => {
    const app = architecture.frames.find((frame) => frame.id === 'FR02')!;
    const books = architecture.screens.find((screen) => screen.id === 'S04')!;
    const more = {
      ...architecture,
      frames: [...architecture.frames, { ...app, id: 'FR03', name: 'Admin frame' }],
      screens: [...architecture.screens, { ...books, id: 'S06', frame: 'FR03', route: '/admin' }],
    };
    const files = frameSkeletons(more, flows, scope, theme);
    expect([...files.keys()]).toEqual([
      'web/app/(routes)/(admin)/layout.tsx',
      'web/app/components/AdminHeaderLeftSlot/AdminHeaderLeftSlot.tsx',
      'web/app/components/AdminHeaderLeftSlot/index.ts',
      'web/app/components/AdminHeaderRightSlot/AdminHeaderRightSlot.tsx',
      'web/app/components/AdminHeaderRightSlot/index.ts',
    ]);
    const layout = files.get('web/app/(routes)/(admin)/layout.tsx')!;
    expect(layout).toContain(
      '<PageLayout layout={layouts.app} kind="app" headerLeft={<AdminHeaderLeftSlot />} headerRight={<AdminHeaderRightSlot />}>',
    );
    expect(layout).toContain("if (user === null) router.replace('/');");
    expect(files.get('web/app/components/AdminHeaderRightSlot/AdminHeaderRightSlot.tsx')).toContain(
      '<UserMenu placement="header" signInHref="/sign-in" />',
    );
  });
});
