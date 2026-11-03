/**
 * What stays fixed below the app sidebar's rows. PageLayout passes it to the
 * sidebar's `SidebarMenu`, which keeps it at the bottom.
 *
 * Holds, as the theme names them, each piece in its own `SidebarMenuItem`
 * from `@packages/ui/SidebarMenu` with `as="div"`, which lines it up with the
 * rows:
 * - Code places `UserMenu` here, in its row, when the theme puts the account
 *   in the sidebar: it opens to the right. Keep it as it is.
 * - A secondary action a flow has, such as Invite: a `Button` from
 *   `@packages/ui/Button`.
 *
 * Leaves out:
 * - Links to destinations: they are the rows, in `AppSidebar`.
 * - A wrapper, padding, background or border of its own: the row and the
 *   menu draw them.
 */
export const AppSidebarFooter = () => null;
