import { describe, expect, it } from 'vitest';
import { theme } from '../02design/__fixtures__/chain';
import { layoutParts, layoutSource, partDoc, partSource } from './parts';

const app = theme.layouts.app;
const withSidebar = {
  ...app,
  logo: 'sidebar' as const,
  account: 'sidebar' as const,
  header: { ...app.header, start: '', end: 'Create button' },
  sidebar: { ...app.sidebar, needed: true, top: 'logo', items: 'shelves', bottom: 'account' },
};
const wiring = { signInHref: '/sign-in' };

describe('layout parts', () => {
  it('make each header slot the theme fills a part, with the logo and the account in the slot that names them', () => {
    expect(layoutParts('App', app)).toEqual([
      { slot: 'headerLeft', name: 'AppHeaderLeftSlot', holds: 'It holds: logo.', logo: 'start' },
      { slot: 'headerRight', name: 'AppHeaderRightSlot', holds: 'It holds: Shelf link, account.', account: 'end' },
    ]);
    const centered = { ...app, header: { ...app.header, start: '', center: 'logo' } };
    expect(layoutParts('App', centered).map((part) => [part.name, part.logo])).toEqual([
      ['AppHeader', 'start'],
      ['AppHeaderRightSlot', undefined],
    ]);
  });

  it('put a sidebar logo above the rows and its account below them', () => {
    expect(layoutParts('App', withSidebar).map((part) => [part.name, part.logo, part.account])).toEqual([
      ['AppHeaderRightSlot', undefined, undefined],
      ['AppSidebarHeader', 'start', undefined],
      ['AppSidebar', undefined, undefined],
      ['AppSidebarFooter', undefined, 'start'],
    ]);
  });
});

describe('part files', () => {
  const doc = '/**\n * The right end.\n */';
  const right = layoutParts('App', app)[1]!;

  it('keep the template guidance, add the theme line once, and place the account', () => {
    const text = partSource(right, doc, wiring);
    expect(text).toContain('/**\n * The right end.\n *\n * The theme puts here: It holds: Shelf link, account.\n */');
    expect(text).toContain('  return (\n    <UserMenu placement="header" signInHref="/sign-in" />\n  );');
    expect(text).toContain("import { UserMenu } from '@app/components/UserMenu';");
    expect(partSource(right, partDoc(text, 'AppHeaderRightSlot'), wiring)).toBe(text);
  });

  it('put each piece of the sidebar header and footer in its own row, and nothing else in one', () => {
    const parts = layoutParts('App', withSidebar);
    const header = partSource(parts.find((part) => part.slot === 'sidebarHeader')!, undefined, wiring);
    expect(header).toContain('  return (\n    <SidebarMenuItem as="div">\n      <PageLogo />\n    </SidebarMenuItem>\n  );');
    expect(header).toContain("import { SidebarMenuItem } from '@packages/ui/SidebarMenu';");
    const footer = partSource(parts.find((part) => part.slot === 'sidebarFooter')!, undefined, wiring);
    expect(footer).toContain(
      '    <SidebarMenuItem as="div">\n      <UserMenu placement="sidebar" signInHref="/sign-in" />\n    </SidebarMenuItem>',
    );
    expect(partSource(right, doc, wiring)).not.toContain('SidebarMenuItem');
  });

  it('put a footer logo at its slot with spacers, and leave a part with nothing placed empty', () => {
    const footer = layoutParts('App', { ...app, logo: 'footer' as const, footer: { ...app.footer, needed: true, end: 'logo' } }).find(
      (part) => part.slot === 'footer',
    )!;
    expect(partSource(footer, undefined, wiring)).toContain('    <>\n      <div className="flex-1" />\n      <PageLogo />\n    </>');
    const rows = layoutParts('App', withSidebar).find((part) => part.slot === 'sidebar')!;
    expect(partSource(rows, undefined)).toBe(
      "/**\n * The theme puts here: Rows: shelves.\n * They are the rows of the sidebar's SidebarMenu: return SidebarMenuItems, not a menu or a bar of your own.\n */\nexport const AppSidebar = () => null;\n",
    );
  });
});

describe('layout files', () => {
  it('render the parts with the kind, imports in order, and send a visitor of signed-in pages home', () => {
    const text = layoutSource('AppLayout', 'The app.', 'app', layoutParts('App', withSidebar), true);
    expect(text.startsWith("'use client';")).toBe(true);
    expect(text).toContain(
      '<PageLayout layout={layouts.app} kind="app" headerRight={<AppHeaderRightSlot />} sidebarHeader={<AppSidebarHeader />} sidebar={<AppSidebar />} sidebarFooter={<AppSidebarFooter />}>',
    );
    expect(text).toContain("if (user === null) router.replace('/');");
    const imports = text.split('\n').filter((line) => line.startsWith('import { ') && line.includes('@app/components/'));
    expect(imports).toEqual([...imports].sort());
    expect(layoutSource('MarketingLayout', 'The site.', 'marketing', [], false)).not.toContain('useCurrentUser');
  });
});
