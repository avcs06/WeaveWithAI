import type { Theme } from '../02design/01theme/build';
import { ACCOUNT, type BarPosition, LOGO, positionIn } from '../02design/config';

// A frame's layout file and its parts in web/app/components. The scaffold
// writes the app's and the marketing site's from the template's parts, with
// the logo where the theme put it; the frames step adds sign-in and the
// account menu, and writes the layout of any further frame.

type Layout = Theme['layouts']['app'];
export type Kind = 'app' | 'marketing';
type Slot = 'headerLeft' | 'header' | 'headerRight' | 'sidebarHeader' | 'sidebar' | 'sidebarFooter' | 'footer';
/** Where an item sits in its part: the footer's by the slot that names it; elsewhere the logo first and the account last. */
type Position = BarPosition;

// The header's center is the header part itself, as the sidebar's rows are the sidebar.
const HEADER_PARTS = {
  start: { slot: 'headerLeft', suffix: 'HeaderLeftSlot' },
  center: { slot: 'header', suffix: 'Header' },
  end: { slot: 'headerRight', suffix: 'HeaderRightSlot' },
} as const;

export type Part = {
  slot: Slot;
  name: string;
  /** What the theme puts there, as a sentence or two. */
  holds: string;
  logo?: Position;
  account?: Position;
};



/** The part files the template ships for each kind, by name. */
export const TEMPLATE_PARTS: Record<Kind, string[]> = {
  app: [
    'AppHeaderLeftSlot',
    'AppHeader',
    'AppHeaderRightSlot',
    'AppSidebarHeader',
    'AppSidebar',
    'AppSidebarFooter',
    'AppFooter',
  ],
  marketing: ['MarketingHeaderLeftSlot', 'MarketingHeader', 'MarketingHeaderRightSlot', 'MarketingFooter'],
};

export const layoutPath = (group: string) => `web/app/(routes)/(${group})/layout.tsx`;
export const partFolder = (name: string) => `web/app/components/${name}`;
export const partPath = (name: string) => `${partFolder(name)}/${name}.tsx`;

export const pascal = (group: string) =>
  group
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const said = (where: string, what: string) => (what ? `${where}: ${what}.` : '');

/** The parts a layout needs, each with what the theme puts in it and whether the logo or the account sits there. */
export function layoutParts(base: string, layout: Layout): Part[] {
  // A slot that names the logo or the account places it; THEME-006 asks for one.
  const logoAt = (bar: 'header' | 'footer') => (layout.logo === bar ? (positionIn(layout[bar], LOGO) ?? 'start') : undefined);
  const accountAt = (bar: 'header' | 'footer') =>
    layout.account === bar ? (positionIn(layout[bar], ACCOUNT) ?? 'end') : undefined;
  // The header's three slots are parts of their own, kept where the theme names something or code places an item.
  const header: Part[] = layout.header.needed
    ? (['start', 'center', 'end'] as const).flatMap((position) => {
        const text = layout.header[position];
        const logo = logoAt('header') === position;
        const account = accountAt('header') === position;
        if (!text && !logo && !account) return [];
        return [
          {
            slot: HEADER_PARTS[position].slot,
            name: `${base}${HEADER_PARTS[position].suffix}`,
            holds: said('It holds', text),
            ...(logo && { logo: 'start' as const }),
            ...(account && { account: 'end' as const }),
          },
        ];
      })
    : [];
  const { start, center, end } = layout.footer;
  const footer: Part[] = layout.footer.needed
    ? [
        {
          slot: 'footer',
          name: `${base}Footer`,
          holds: [said('Start', start), said('Center', center), said('End', end)].filter(Boolean).join(' '),
          logo: logoAt('footer'),
          account: accountAt('footer'),
        },
      ]
    : [];
  const { needed, top, items, bottom } = layout.sidebar;
  const logo = layout.logo === 'sidebar';
  const account = layout.account === 'sidebar';
  const sidebar: Part[] = needed
    ? [
        ...(top || logo ? [{ slot: 'sidebarHeader' as const, name: `${base}SidebarHeader`, holds: said('It holds', top), ...(logo && { logo: 'start' as const }) }] : []),
        { slot: 'sidebar', name: `${base}Sidebar`, holds: said('Rows', items) },
        ...(bottom || account ? [{ slot: 'sidebarFooter' as const, name: `${base}SidebarFooter`, holds: said('It holds', bottom), ...(account && { account: 'start' as const }) }] : []),
      ]
    : [];
  return [...header, ...sidebar, ...footer];
}

/** The doc comment over a part's export in its file, or undefined. */
export function partDoc(text: string | undefined, name: string): string | undefined {
  const at = text?.indexOf(`export const ${name}`) ?? -1;
  if (!text || at === -1) return undefined;
  const end = text.lastIndexOf('*/', at);
  const start = end === -1 ? -1 : text.lastIndexOf('/**', end);
  return start === -1 ? undefined : text.slice(start, end + 2);
}

const ROW = 'PageLayout lays its items in a row with the theme\'s gap. Return its items, not a bar of your own.';
const SLOT = 'PageLayout keeps it at its place in the header and lays its items in a row. Return its items, not a bar of your own.';
const ROWS = 'They are the rows of the sidebar\'s SidebarMenu: return SidebarMenuItems, not a menu or a bar of your own.';
const FIXED = 'The sidebar\'s SidebarMenu keeps it fixed beside its rows. Return its items, not a bar of your own.';

/** The theme's line for the part, added under the template's guidance, or a comment of its own for a part with none. */
function partComment(part: Part, doc: string | undefined): string {
  const theme = part.holds ? `The theme puts here: ${part.holds}` : 'The theme names nothing more here.';
  // A part written before keeps one theme line: the new one.
  const guidance = doc?.replace(/\n \*\n \* The theme (puts here:[^\n]*|names nothing more here\.)(?=\n \*\/)/, '');
  if (guidance) return guidance.replace(/\n?\s*\*\/$/, `\n *\n * ${theme}\n */`);
  const flow = part.slot === 'sidebar' ? ROWS : part.slot === 'footer' ? ROW : part.slot.startsWith('header') ? SLOT : FIXED;
  return `/**\n * ${theme}\n * ${flow}\n */`;
}

/** Where the account menu's Sign in leads: the app's sign-in page. */
export type AccountWiring = { signInHref: string };

/** A part's file: its comment, then the logo and the account where the theme put them, empty otherwise. */
export function partSource(part: Part, doc: string | undefined, wiring?: AccountWiring): string {
  const account = part.account ? wiring : undefined;
  const userMenu = account && [
    `<UserMenu placement="${part.slot === 'sidebarFooter' ? 'sidebar' : 'header'}" signInHref="${account.signInHref}" />`,
  ];
  const at: Record<Position, string[][]> = { start: [], center: [], end: [] };
  if (part.logo) at[part.logo].push(['<PageLogo />']);
  if (userMenu && part.account) at[part.account].push(userMenu);
  // In the footer, spacers push the center and the end over; a header slot sits where PageLayout keeps it.
  const spacer = ['<div className="flex-1" />'];
  const bar = part.slot === 'footer';
  const items = [
    ...at.start,
    ...(bar && at.center.length ? [spacer] : []),
    ...at.center,
    ...(bar && at.center.length ? [spacer] : []),
    ...(bar && at.end.length && !at.center.length ? [spacer] : []),
    ...at.end,
  ];
  const comment = partComment(part, doc);
  if (!items.length) return `${comment}\nexport const ${part.name} = () => null;\n`;

  const lines = items.length === 1 ? items[0]! : ['<>', ...items.flat().map((line) => `  ${line}`), '</>'];
  const imports = [
    ...(part.logo ? ["import { PageLogo } from '@app/components/PageLogo';"] : []),
    ...(account ? ["import { UserMenu } from '@app/components/UserMenu';"] : []),
    "import React from 'react';",
  ];
  return `${imports.join('\n')}

${comment}
export const ${part.name} = () => {
  return (
${lines.map((line) => `    ${line}`).join('\n')}
  );
};
`;
}

/** A route group's layout file: PageLayout with the kind's layout and parts, and for signed-in pages, the way back for a visitor. */
export function layoutSource(name: string, doc: string, kind: Kind, parts: Part[], signedIn: boolean): string {
  const imports = [
    ...[...parts.map((part) => part.name), 'PageLayout'].sort().map((part) =>
      part === 'PageLayout'
        ? "import { layouts, PageLayout } from '@app/components/PageLayout';"
        : `import { ${part} } from '@app/components/${part}';`,
    ),
    ...(signedIn ? ["import { useCurrentUser } from '@app/entities/auth';", "import { useRouter } from 'next/navigation';"] : []),
    `import React${signedIn ? ', { useEffect }' : ''} from 'react';`,
  ];
  const slots = parts.map((part) => ` ${part.slot}={<${part.name} />}`).join('');
  const guard = signedIn
    ? `  const user = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (user === null) router.replace('/');
  }, [user, router]);

  // Undefined until the saved session is read.
  if (!user) return null;

`
    : '';
  return `${signedIn ? "'use client';\n\n" : ''}${imports.join('\n')}

/** ${doc}${signedIn ? ' A visitor who is not signed in goes to the landing page.' : ''} */
export default function ${name}({ children }: { children: React.ReactNode }) {
${guard}  return (
    <PageLayout layout={layouts.${kind}} kind="${kind}"${slots}>
      {children}
    </PageLayout>
  );
}
`;
}
