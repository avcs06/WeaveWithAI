/**
 * The sidebar's rows. PageLayout renders the sidebar as a `SidebarMenu`: its
 * width, background and separation, the menu's spacing, and a list of rows
 * that scrolls. The starter's sidebar is empty.
 *
 * Holds, as the layout's sidebar names them:
 * - One `SidebarMenuItem` from `@packages/ui/SidebarMenu` per destination,
 *   in the order the user needs them: `as={NextLink}` with its `href`, the
 *   `NextLink` from `@app/components/NextLink`. Mark the current page's row
 *   `selected`, from `usePathname()` of `next/navigation`. An icon goes in
 *   `leftIcon`, a count in `rightAddOn`.
 * - A list the user works through, such as their projects, one row each.
 *
 * Fixed above and below the rows, through PageLayout's own props:
 * - `sidebarHeader`: a Create button, a search, or the logo when the app has
 *   no header.
 * - `sidebarFooter`: the account, `UserMenu` from `@app/components/UserMenu`
 *   with `placement="sidebar"`.
 *
 * Leaves out:
 * - An `aside`, `nav`, `SidebarMenu`, list or wrapper of its own, and any
 *   width, padding, background or border: PageLayout draws them.
 * - Buttons, fields or text among the rows: rows are links. Actions go in
 *   `sidebarHeader` or `sidebarFooter`.
 * - Destinations the header already holds, and pages no flow leads to.
 */
export const LayoutSidebar = () => null;
