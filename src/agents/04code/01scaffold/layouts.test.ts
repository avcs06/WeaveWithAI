import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { theme } from '../../02design/__fixtures__/chain';
import { scaffoldLayouts } from './layouts';

// The template's own part files, as the scaffold finds them in a fresh app.
const read = (file: string) => (existsSync(`template/${file}`) ? readFileSync(`template/${file}`, 'utf8') : undefined);
const wiring = { signInHref: '/sign-in' };

describe('scaffold layouts', () => {
  const { files, removed } = scaffoldLayouts(theme, read, wiring);

  it('keep the parts the theme needs and drop the rest', () => {
    expect([...files.keys()]).toEqual([
      'web/app/components/AppHeaderLeftSlot/AppHeaderLeftSlot.tsx',
      'web/app/components/AppHeaderRightSlot/AppHeaderRightSlot.tsx',
      'web/app/(routes)/(app)/layout.tsx',
      'web/app/components/MarketingHeaderLeftSlot/MarketingHeaderLeftSlot.tsx',
      'web/app/components/MarketingHeaderRightSlot/MarketingHeaderRightSlot.tsx',
      'web/app/(routes)/(marketing)/layout.tsx',
    ]);
    expect(removed).toEqual([
      'web/app/components/AppHeader',
      'web/app/components/AppSidebarHeader',
      'web/app/components/AppSidebar',
      'web/app/components/AppSidebarFooter',
      'web/app/components/AppFooter',
      'web/app/components/MarketingHeader',
      'web/app/components/MarketingFooter',
    ]);
  });

  it('keep the template guidance in a slot, with the theme line, and place the logo and the account', () => {
    const left = files.get('web/app/components/AppHeaderLeftSlot/AppHeaderLeftSlot.tsx')!;
    expect(left).toContain('Code places `PageLogo` here');
    expect(left).toContain(' * The theme puts here: It holds: logo.\n */');
    expect(left).toContain('<PageLogo />');
    const right = files.get('web/app/components/AppHeaderRightSlot/AppHeaderRightSlot.tsx')!;
    expect(right).toContain('<UserMenu placement="header" signInHref="/sign-in" />');
    expect(right).not.toContain('useThemeMode');
  });

  it('render only the kept parts, and send a visitor of the app home', () => {
    const app = files.get('web/app/(routes)/(app)/layout.tsx')!;
    expect(app).toContain(
      '<PageLayout layout={layouts.app} kind="app" headerLeft={<AppHeaderLeftSlot />} headerRight={<AppHeaderRightSlot />}>',
    );
    expect(app).toContain("if (user === null) router.replace('/');");
    const marketing = files.get('web/app/(routes)/(marketing)/layout.tsx')!;
    expect(marketing).toContain(
      '<PageLayout layout={layouts.marketing} kind="marketing" headerLeft={<MarketingHeaderLeftSlot />} headerRight={<MarketingHeaderRightSlot />}>',
    );
    expect(marketing).not.toContain('useCurrentUser');
  });

  it('put the logo and the account in the sidebar when the theme puts them there', () => {
    const sided = {
      ...theme,
      layouts: {
        ...theme.layouts,
        app: {
          ...theme.layouts.app,
          logo: 'sidebar' as const,
          account: 'sidebar' as const,
          header: { ...theme.layouts.app.header, start: '', end: 'Create button' },
          sidebar: { ...theme.layouts.app.sidebar, needed: true, top: 'logo', items: 'shelves', bottom: 'account' },
        },
      },
    };
    const sidebar = scaffoldLayouts(sided, read, wiring).files;
    expect(sidebar.get('web/app/components/AppSidebarHeader/AppSidebarHeader.tsx')).toContain('<PageLogo />');
    expect(sidebar.get('web/app/components/AppSidebarFooter/AppSidebarFooter.tsx')).toContain(
      '<UserMenu placement="sidebar" signInHref="/sign-in" />',
    );
    expect(sidebar.has('web/app/components/AppHeaderLeftSlot/AppHeaderLeftSlot.tsx')).toBe(false);
  });
});
