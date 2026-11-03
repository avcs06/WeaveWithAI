import type { Theme } from '../02design/01theme/build';
import { ACCOUNT, type BarPosition, LOGO, positionIn } from '../02design/config';

// A frame's layout file and its parts in web/app/components. The scaffold
// writes the app's and the marketing site's from the template's parts, with
// the logo where the theme put it; the frames step adds sign-in and the
// account menu, and writes the layout of any further frame.

type Layout = Theme['layouts']['app'];
export type Kind = 'app' | 'marketing';
type Slot = 'header' | 'sidebarHeader' | 'sidebar' | 'sidebarFooter' | 'footer';
/** A sidebar's header and footer hold the logo or the account at the start. */
type Position = BarPosition;

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
  app: ['AppHeader', 'AppSidebarHeader', 'AppSidebar', 'AppSidebarFooter', 'AppFooter'],
  marketing: ['MarketingHeader', 'MarketingFooter'],
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
  const bar = (slot: 'header' | 'footer', suffix: string): Part[] => {
    const { needed, start, center, end } = layout[slot];
    const holds = [said('Start', start), said('Center', center), said('End', end)].filter(Boolean).join(' ');
    // A slot that names the logo or the account places it; THEME-006 asks for one.
    const logo = layout.logo === slot ? (positionIn(layout[slot], LOGO) ?? 'start') : undefined;
    const account = layout.account === slot ? (positionIn(layout[slot], ACCOUNT) ?? 'end') : undefined;
    return needed ? [{ slot, name: `${base}${suffix}`, holds, logo, account }] : [];
  };
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
  return [...bar('header', 'Header'), ...sidebar, ...bar('footer', 'Footer')];
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
const ROWS = 'They are the rows of the sidebar\'s SidebarMenu: return SidebarMenuItems, not a menu or a bar of your own.';
const FIXED = 'The sidebar\'s SidebarMenu keeps it fixed beside its rows. Return its items, not a bar of your own.';

/** The theme's line for the part, added under the template's guidance, or a comment of its own for a part with none. */
function partComment(part: Part, doc: string | undefined): string {
  const theme = part.holds ? `The theme puts here: ${part.holds}` : 'The theme names nothing more here.';
  // A part written before keeps one theme line: the new one.
  const guidance = doc?.replace(/\n \*\n \* The theme (puts here:[^\n]*|names nothing more here\.)(?=\n \*\/)/, '');
  if (guidance) return guidance.replace(/\n?\s*\*\/$/, `\n *\n * ${theme}\n */`);
  const flow = part.slot === 'sidebar' ? ROWS : part.slot === 'header' || part.slot === 'footer' ? ROW : FIXED;
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
  // Spacers push the center and the end over, as the agent's own items will be.
  const spacer = ['<div className="flex-1" />'];
  const items = [
    ...at.start,
    ...(at.center.length ? [spacer, ...at.center, spacer] : []),
    ...(at.end.length && !at.center.length ? [spacer] : []),
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
