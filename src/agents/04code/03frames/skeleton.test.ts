import { describe, expect, it } from 'vitest';
import { architecture, flows, scope, theme } from '../../02design/__fixtures__/chain';
import { frameSkeletons } from './skeleton';

describe('frame skeletons', () => {
  const withSidebar = {
    ...theme,
    layouts: {
      ...theme.layouts,
      app: {
        ...theme.layouts.app,
        sidebar: { ...theme.layouts.app.sidebar, needed: true, top: 'the Add book button', items: 'the shelves', bottom: 'the account' },
      },
    },
  };

  it('write a layout per frame on the theme layout its screens need, and an empty part per bar and sidebar area it needs', () => {
    const files = frameSkeletons(architecture, flows, scope, withSidebar);
    expect([...files.keys()]).toEqual([
      'web/app/(routes)/(landing)/layout.tsx',
      'web/app/blocks/LandingHeader/LandingHeader.tsx',
      'web/app/blocks/LandingHeader/index.ts',
      'web/app/(routes)/(app)/layout.tsx',
      'web/app/blocks/AppHeader/AppHeader.tsx',
      'web/app/blocks/AppHeader/index.ts',
      'web/app/blocks/AppSidebarHeader/AppSidebarHeader.tsx',
      'web/app/blocks/AppSidebarHeader/index.ts',
      'web/app/blocks/AppSidebar/AppSidebar.tsx',
      'web/app/blocks/AppSidebar/index.ts',
      'web/app/blocks/AppSidebarFooter/AppSidebarFooter.tsx',
      'web/app/blocks/AppSidebarFooter/index.ts',
    ]);
    expect(files.get('web/app/(routes)/(landing)/layout.tsx')).toContain(
      '<PageLayout layout={layouts.marketing} header={<LandingHeader />}>',
    );
    expect(files.get('web/app/(routes)/(app)/layout.tsx')).toContain(
      '<PageLayout layout={layouts.app} scrollMain header={<AppHeader />} sidebarHeader={<AppSidebarHeader />} sidebar={<AppSidebar />} sidebarFooter={<AppSidebarFooter />}>',
    );
    expect(files.get('web/app/blocks/AppSidebar/AppSidebar.tsx')).toContain('Rows: the shelves.');
    expect(files.get('web/app/blocks/AppSidebar/AppSidebar.tsx')).toContain('return SidebarMenuItems');
    expect(files.get('web/app/blocks/AppSidebarFooter/AppSidebarFooter.tsx')).toContain('It holds: the account.');
    expect(files.get('web/app/blocks/AppSidebar/AppSidebar.tsx')).toContain('export const AppSidebar = () => null;');
  });

  it('send a visitor of a signed-in frame to the landing page, and leave a public frame open', () => {
    const files = frameSkeletons(architecture, flows, scope, theme);
    const app = files.get('web/app/(routes)/(app)/layout.tsx')!;
    expect(app.startsWith("'use client';")).toBe(true);
    expect(app).toContain("if (user === null) router.replace('/');");
    const site = files.get('web/app/(routes)/(landing)/layout.tsx')!;
    expect(site).not.toContain('useCurrentUser');
    expect(site).not.toContain("'use client'");
  });
});
