/**
 * What stays fixed above the app sidebar's rows. PageLayout passes it to the
 * sidebar's `SidebarMenu`, whose rows scroll under it with the menu's spacing.
 *
 * Holds, as the theme names them, each piece in its own `SidebarMenuItem`
 * from `@packages/ui/SidebarMenu` with `as="div"`, which lines it up with the
 * rows:
 * - The app's main action, such as Create: a `Button` from
 *   `@packages/ui/Button`.
 * - A search over the rows, when a flow has one: `SearchInput` from
 *   `@packages/ui/Input`.
 * - Code places `PageLogo` here, in its row, when the theme puts the logo in
 *   the sidebar. Keep it as it is.
 *
 * Leaves out:
 * - Links to destinations: they are the rows, in `AppSidebar`.
 * - A wrapper, padding, background or border of its own: the row and the
 *   menu draw them.
 */
export const AppSidebarHeader = () => null;
