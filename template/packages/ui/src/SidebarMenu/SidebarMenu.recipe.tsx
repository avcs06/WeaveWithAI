/**
 * SidebarMenu: a sidebar's navigation. Its `header` holds what sits above
 * the list, like the logo, a search or a Create button, its `footer` what
 * sits below it, like the account and sign out, and the rows between them
 * are SidebarMenuItems, one per destination, which scroll when there are
 * more than fit. It fills the height the sidebar gives it, so the
 * sidebar sets that height: the one under the app's header.
 *
 * When not to use:
 * - A header's main navigation: a row of the app's NextLinks.
 * - A menu of actions behind a button: Dropdown. Sections of one page: Tabs.
 * - Records the user browses: a list or a Table on the page, not the sidebar.
 *
 * Pitfalls:
 * - The sidebar sets the height; SidebarMenu takes all of it. Without a
 *   height nothing scrolls and the footer sits right under the last row.
 * - `selected` comes from the current route (`usePathname()` in the Next
 *   app); it marks the row `aria-current="page"`.
 * - `as` takes a link component, the app's NextLink, with its `href`; the
 *   row's children are the label.
 * - Rows are links. Anything else in the sidebar, like the logo, a search, a
 *   Create button or Sign out, goes in `header` or `footer`, never in a row.
 *   Each of those pieces sits in its own `SidebarMenuItem as="div"`, so it
 *   lines up with the links; never pad or wrap it yourself.
 * - The sidebar wears the frame's background (`bg-surface-frame`); the rows
 *   are colored for it.
 */
import { Avatar } from '@packages/ui/Avatar';
import { Button, IconButton } from '@packages/ui/Button';
import { Link } from '@packages/ui/Link';
import { SidebarMenu, SidebarMenuItem } from '@packages/ui/SidebarMenu';
import { Tag } from '@packages/ui/Tag';
import { Truncate } from '@packages/ui/Truncate';
import { LayoutDashboard, LogOut, Plus, Settings, Star } from 'lucide-react';
import React, { type ReactNode, useState } from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const dashboards = [
  { id: 'd1', name: 'Morning routine' },
  { id: 'd2', name: 'Deep work' },
  { id: 'd3', name: 'Evening wind down' },
];

const many = Array.from({ length: 24 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `Project ${i + 1}`,
}));

/** Stands in for the sidebar of an app frame: the frame sets its width and the height under the header. */
const Sidebar = ({ children }: { children: ReactNode }) => (
  <div
    className="bg-surface-frame p-4"
    style={{
      // The frame's sidebar width; this box stands in for it.
      width: 264,
      // The height under the app's header, so a long list scrolls.
      height: 360,
    }}
  >
    {children}
  </div>
);

// Usage: the patterns to copy.
/**
 * An app sidebar: the frame's Create in the header, one row per dashboard
 * with the current one selected, and the account with sign out in the
 * footer, which stays at the bottom. The header's and footer's pieces sit in
 * `as="div"` rows, lined up with the links.
 */
const AppSidebar = () => {
  const [current, setCurrent] = useState('d1');

  return (
    <Sidebar>
      <SidebarMenu
        aria-label="Dashboards"
        header={
          <SidebarMenuItem as="div">
            <Button leftIcon={<Plus />} className="w-full">
              Create
            </Button>
          </SidebarMenuItem>
        }
        footer={
          <SidebarMenuItem as="div">
            <Avatar size="sm" name="Ada Lovelace" />
            <Truncate>ada@example.com</Truncate>
            <IconButton tooltip="Sign out">
              <LogOut />
            </IconButton>
          </SidebarMenuItem>
        }
      >
        {dashboards.map((dashboard) => (
          <SidebarMenuItem
            key={dashboard.id}
            href={`/dashboards/${dashboard.id}`}
            leftIcon={<LayoutDashboard />}
            selected={dashboard.id === current}
            onClick={(event) => {
              event.preventDefault();
              setCurrent(dashboard.id);
            }}
          >
            {dashboard.name}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </Sidebar>
  );
};

/**
 * In the Next app, each row is the app's NextLink with `as`, so the route
 * changes without a reload; Link stands in for it here.
 */
const WithNextLink = () => (
  <Sidebar>
    <SidebarMenu aria-label="Settings">
      <SidebarMenuItem
        as={Link}
        href="/settings/profile"
        selected
        leftIcon={<Settings />}
      >
        Profile
      </SidebarMenuItem>
      <SidebarMenuItem as={Link} href="/settings/plan" leftIcon={<Star />}>
        Plan
      </SidebarMenuItem>
    </SidebarMenu>
  </Sidebar>
);

/**
 * More rows than fit: the list scrolls between the header and the footer,
 * which keep their place.
 */
const Scrolling = () => (
  <Sidebar>
    <SidebarMenu
      aria-label="Projects"
      header={
        <SidebarMenuItem as="div">
          <Button className="w-full">New project</Button>
        </SidebarMenuItem>
      }
      footer={
        <SidebarMenuItem as="div">
          <Truncate>24 projects</Truncate>
        </SidebarMenuItem>
      }
    >
      {many.map((project) => (
        <SidebarMenuItem key={project.id} href={`/projects/${project.id}`}>
          {project.name}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  </Sidebar>
);

/**
 * A count at the end of a row with `rightAddOn`, and a label too long for the
 * row, cut with the whole of it in a tooltip.
 */
const CountsAndLongLabels = () => (
  <Sidebar>
    <SidebarMenu aria-label="Folders">
      <SidebarMenuItem href="/folders/inbox" rightAddOn={<Tag>12</Tag>}>
        Inbox
      </SidebarMenuItem>
      <SidebarMenuItem href="/folders/conference" rightAddOn={<Tag>3</Tag>}>
        Spring conference planning with the whole design team
      </SidebarMenuItem>
    </SidebarMenu>
  </Sidebar>
);

export default function SidebarMenuRecipe() {
  return (
    <div className="flex-row-gap-6 flex-wrap items-start">
      <AppSidebar />
      <WithNextLink />
      <Scrolling />
      <CountsAndLongLabels />
    </div>
  );
}
