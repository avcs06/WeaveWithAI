import type { Scope } from '../../01flows/01scope/schema';
import type { Flows } from '../../01flows/schema';
import type { Theme } from '../../02design/01theme/build';
import type { Architecture, Frame } from '../../02design/02architect/schema';
import { routeGroups, signedInFrame } from '../01scaffold/weave';

// Each frame's layout written by code: PageLayout with the theme's app or
// marketing layout, the redirect of a signed-in frame, and one empty part per
// bar the layout needs. The frames session fills the parts; the layout file
// and PageLayout are protected, so the frame's size, sticking and container
// stay as the theme set them.

type Layout = Theme['layouts']['app'];
type Part = {
  slot: 'header' | 'sidebarHeader' | 'sidebar' | 'sidebarFooter' | 'footer';
  /** What the part is, for its comment. */
  label: string;
  name: string;
  holds: string;
  /** How PageLayout lays the part out, and what to return. */
  flow: string;
};

/** A frame's route group layout file. */
export const frameLayoutFile = (group: string) => `web/app/(routes)/(${group})/layout.tsx`;

const pascal = (group: string) =>
  group
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const said = (where: string, what: string) => (what ? `${where}: ${what}.` : '');

const ROW = 'PageLayout lays its children out in a row with the theme\'s gap, centered in the bar. Return its items, not a bar of your own.';
const ROWS = 'They are the rows of the sidebar\'s SidebarMenu: return SidebarMenuItems, not a menu or a bar of your own.';
const fixed = (where: string) =>
  `The sidebar's SidebarMenu keeps it fixed ${where} its rows, with the menu's spacing. Return its items, not a bar of your own.`;

/** The parts the layout needs, each with what the theme puts in it: a bar's row, or the sidebar's rows and what sits fixed above and below them. */
function parts(base: string, layout: Layout): Part[] {
  const bar = (slot: 'header' | 'footer', suffix: string): Part[] => {
    const { needed, start, center, end } = layout[slot];
    const holds = [said('Start', start), said('Center', center), said('End', end)].filter(Boolean).join(' ');
    return needed ? [{ slot, label: slot, name: `${base}${suffix}`, holds: holds || 'Nothing named by the theme.', flow: ROW }] : [];
  };
  const { needed, top, items, bottom } = layout.sidebar;
  const sidebar: Part[] = needed
    ? [
        ...(top ? [{ slot: 'sidebarHeader', label: "sidebar's header", name: `${base}SidebarHeader`, holds: said('It holds', top), flow: fixed('above') } as const] : []),
        { slot: 'sidebar', label: "sidebar's rows", name: `${base}Sidebar`, holds: said('Rows', items) || 'Nothing named by the theme.', flow: ROWS },
        ...(bottom ? [{ slot: 'sidebarFooter', label: "sidebar's footer", name: `${base}SidebarFooter`, holds: said('It holds', bottom), flow: fixed('below') } as const] : []),
      ]
    : [];
  return [...bar('header', 'Header'), ...sidebar, ...bar('footer', 'Footer')];
}

function partFile(part: Part, frame: Frame, kind: string): string {
  return `/**
 * The ${part.label} of ${frame.name} (${frame.id}), in the ${kind} layout. ${part.holds}
 * ${part.flow}
 */
export const ${part.name} = () => null;
`;
}

function layoutFile(frame: Frame, group: string, kind: 'app' | 'marketing', all: Part[], signedIn: boolean): string {
  const name = `${pascal(group)}Layout`;
  const imports = [
    ...all.map((part) => `import { ${part.name} } from '@app/blocks/${part.name}';`).sort(),
    "import { layouts, PageLayout } from '@app/components/PageLayout';",
    ...(signedIn ? ["import { useCurrentUser } from '@app/entities/auth';", "import { useRouter } from 'next/navigation';"] : []),
    `import React${signedIn ? ', { useEffect }' : ''} from 'react';`,
  ];
  const slots = all.map((part) => ` ${part.slot}={<${part.name} />}`).join('');
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

// Written by the generator from the theme's ${kind} layout. The frame's content lives in its parts in web/app/blocks.

/** ${frame.name} (${frame.id}).${signedIn ? ' A visitor who is not signed in goes to the landing page.' : ''} */
export default function ${name}({ children }: { children: React.ReactNode }) {
${guard}  return (
    <PageLayout layout={layouts.${kind}} kind="${kind}"${slots}>
      {children}
    </PageLayout>
  );
}
`;
}

/** Every frame's layout and empty parts, by path. Frames without screens have no route group, so none. Pure. */
export function frameSkeletons(architecture: Architecture, flows: Flows, scope: Scope, theme: Theme): Map<string, string> {
  const files = new Map<string, string>();
  const groups = routeGroups(architecture, flows, scope);
  for (const frame of architecture.frames) {
    const group = groups.get(frame.id);
    if (!group) continue;
    const signedIn = signedInFrame(architecture, flows, scope, frame);
    const kind = signedIn ? 'app' : 'marketing';
    const all = parts(pascal(group), theme.layouts[kind]);
    files.set(frameLayoutFile(group), layoutFile(frame, group, kind, all, signedIn));
    for (const part of all) {
      files.set(`web/app/blocks/${part.name}/${part.name}.tsx`, partFile(part, frame, kind));
      files.set(`web/app/blocks/${part.name}/index.ts`, `export { ${part.name} } from './${part.name}';\n`);
    }
  }
  return files;
}
