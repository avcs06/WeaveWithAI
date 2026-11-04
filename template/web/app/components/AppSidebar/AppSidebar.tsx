/**
 * The rows of the app's sidebar: one link per page.
 *
 * Put here:
 * - One `SidebarMenuItem` from `@packages/ui/SidebarMenu` per page, in the
 *   order the user needs them. Each row opens a route from
 *   `.weave/01-scaffold/routes.json`.
 * - Make each row a link: `as={NextLink}` with its `href`, using `NextLink`
 *   from `@app/components/NextLink`.
 * - Mark the current page's row `selected`, from `usePathname()` of
 *   `next/navigation`.
 * - Put a row's icon in `leftIcon`, and a count in `rightAddOn`.
 * - A list the user works through, such as their projects, is one row per
 *   item.
 *
 * Example:
 *   <SidebarMenuItem
 *     as={NextLink}
 *     href="/clients"
 *     selected={pathname.startsWith('/clients')}
 *   >
 *     Clients
 *   </SidebarMenuItem>
 *
 * PageLayout renders the sidebar as a `SidebarMenu`. It draws the width,
 * the background and the spacing. The rows scroll between
 * `AppSidebarHeader` and `AppSidebarFooter`. Return only the rows.
 *
 * Never put here:
 * - An `aside`, `nav`, `SidebarMenu`, list or wrapper. PageLayout draws
 *   them.
 * - A button, a field or text among the rows. Actions go in
 *   `AppSidebarHeader` or `AppSidebarFooter`.
 * - A page the header already links to, or a page no flow leads to.
 *
 * The line "The theme puts here" below names this app's items. Build those
 * and nothing else.
 */
export const AppSidebar = () => null;
