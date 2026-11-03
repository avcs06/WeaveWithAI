/**
 * What stays fixed below the app sidebar's rows. PageLayout passes it to the
 * sidebar's `SidebarMenu`, which keeps it at the bottom.
 *
 * Holds, as the theme names them:
 * - Code places `UserMenu` here when the theme puts the account in the
 *   sidebar: it opens to the right. Keep it as it is.
 * - A secondary action a flow has, such as Invite: a `Button` from
 *   `@packages/ui/Button`.
 *
 * Leaves out:
 * - Links to destinations: they are the rows, in `AppSidebar`.
 * - A wrapper, padding, background or border: the menu draws them.
 */
export const AppSidebarFooter = () => null;
