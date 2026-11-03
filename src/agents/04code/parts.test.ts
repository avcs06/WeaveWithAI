import { describe, expect, it } from 'vitest';
import { theme } from '../02design/__fixtures__/chain';
import { layoutParts, layoutSource, partDoc, partSource } from './parts';

const app = theme.layouts.app;
const withSidebar = {
  ...app,
  logo: 'sidebar' as const,
  account: 'sidebar' as const,
  sidebar: { ...app.sidebar, needed: true, top: 'the logo', items: 'the shelves', bottom: 'the account' },
};

describe('layout parts', () => {
  it('place the logo and the account at the slot that names them', () => {
    expect(layoutParts('App', app)).toEqual([
      { slot: 'header', name: 'AppHeader', holds: 'Start: the logo. End: the Shelf link and the account.', logo: 'start', account: 'end' },
    ]);
    const centered = { ...app, header: { ...app.header, start: '', center: 'the logo' } };
    expect(layoutParts('App', centered)[0]).toMatchObject({ logo: 'center', account: 'end' });
  });

  it('put a sidebar logo above the rows and its account below them', () => {
    expect(layoutParts('App', withSidebar).map((part) => [part.name, part.logo, part.account])).toEqual([
      ['AppHeader', undefined, undefined],
      ['AppSidebarHeader', 'start', undefined],
      ['AppSidebar', undefined, undefined],
      ['AppSidebarFooter', undefined, 'start'],
    ]);
  });
});

describe('part files', () => {
  const doc = '/**\n * The header items.\n */';
  const [header] = layoutParts('App', app);

  it('keep the template guidance, add the theme line once, and place the logo and the account', () => {
    const text = partSource(header!, doc, { signInHref: '/sign-in' });
    expect(text).toContain('/**\n * The header items.\n *\n * The theme puts here: Start: the logo. End: the Shelf link and the account.\n */');
    expect(text).toContain(
      '    <>\n      <PageLogo />\n      <div className="flex-1" />\n      <UserMenu placement="header" signInHref="/sign-in" />\n    </>',
    );
    expect(text).toContain("import { UserMenu } from '@app/components/UserMenu';");
    const again = partSource(header!, partDoc(text, 'AppHeader'), { signInHref: '/sign-in' });
    expect(again).toBe(text);
  });

  it('leave a part with nothing placed empty, and a part with no template its own comment', () => {
    const rows = layoutParts('App', withSidebar).find((part) => part.slot === 'sidebar')!;
    expect(partSource(rows, undefined)).toBe(
      "/**\n * The theme puts here: Rows: the shelves.\n * They are the rows of the sidebar's SidebarMenu: return SidebarMenuItems, not a menu or a bar of your own.\n */\nexport const AppSidebar = () => null;\n",
    );
  });
});

describe('layout files', () => {
  it('render the parts with the kind, imports in order, and send a visitor of signed-in pages home', () => {
    const parts = layoutParts('App', withSidebar);
    const text = layoutSource('AppLayout', 'The app.', 'app', parts, true);
    expect(text.startsWith("'use client';")).toBe(true);
    expect(text).toContain(
      '<PageLayout layout={layouts.app} kind="app" header={<AppHeader />} sidebarHeader={<AppSidebarHeader />} sidebar={<AppSidebar />} sidebarFooter={<AppSidebarFooter />}>',
    );
    expect(text).toContain("if (user === null) router.replace('/');");
    const imports = text.split('\n').filter((line) => line.startsWith("import { ") && line.includes('@app/components/'));
    expect(imports).toEqual([...imports].sort());
    expect(layoutSource('MarketingLayout', 'The site.', 'marketing', [], false)).not.toContain('useCurrentUser');
  });
});
