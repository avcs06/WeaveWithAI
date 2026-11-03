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
      'web/app/components/AppHeader/AppHeader.tsx',
      'web/app/(routes)/(app)/layout.tsx',
      'web/app/components/MarketingHeader/MarketingHeader.tsx',
      'web/app/(routes)/(marketing)/layout.tsx',
    ]);
    expect(removed).toEqual([
      'web/app/components/AppSidebarHeader',
      'web/app/components/AppSidebar',
      'web/app/components/AppSidebarFooter',
      'web/app/components/AppFooter',
      'web/app/components/MarketingFooter',
    ]);
  });

  it('keep the template guidance in a part, with the theme line, the logo and the account', () => {
    const header = files.get('web/app/components/AppHeader/AppHeader.tsx')!;
    expect(header).toContain('Code places `PageLogo` and `UserMenu` here');
    expect(header).toContain(' * The theme puts here: Start: the logo. End: the Shelf link and the account.\n */');
    expect(header).toContain('<PageLogo />');
    expect(header).toContain('<UserMenu placement="header" signInHref="/sign-in" />');
    expect(header).not.toContain('useThemeMode');
  });

  it('render only the kept parts, and send a visitor of the app home', () => {
    const app = files.get('web/app/(routes)/(app)/layout.tsx')!;
    expect(app).toContain('<PageLayout layout={layouts.app} kind="app" header={<AppHeader />}>');
    expect(app).toContain("if (user === null) router.replace('/');");
    const marketing = files.get('web/app/(routes)/(marketing)/layout.tsx')!;
    expect(marketing).toContain('<PageLayout layout={layouts.marketing} kind="marketing" header={<MarketingHeader />}>');
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
          sidebar: { ...theme.layouts.app.sidebar, needed: true, top: 'the logo', items: 'the shelves', bottom: 'the account' },
        },
      },
    };
    const sidebar = scaffoldLayouts(sided, read, wiring).files;
    expect(sidebar.get('web/app/components/AppSidebarHeader/AppSidebarHeader.tsx')).toContain('<PageLogo />');
    expect(sidebar.get('web/app/components/AppSidebarFooter/AppSidebarFooter.tsx')).toContain(
      '<UserMenu placement="sidebar" signInHref="/sign-in" />',
    );
    expect(sidebar.get('web/app/components/AppHeader/AppHeader.tsx')).not.toContain('<PageLogo />');
  });
});
