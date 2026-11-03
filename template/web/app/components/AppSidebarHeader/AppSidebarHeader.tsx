/**
 * What stays fixed above the app sidebar's rows. PageLayout passes it to the
 * sidebar's `SidebarMenu`, whose rows scroll under it with the menu's spacing.
 *
 * Holds, as the theme names them:
 * - The app's main action, such as Create: a `Button` from
 *   `@packages/ui/Button`.
 * - A search over the rows, when a flow has one: `SearchInput` from
 *   `@packages/ui/Input`.
 * - Code places `PageLogo` here when the theme puts the logo in the sidebar.
 *   Keep it as it is.
 *
 * Leaves out:
 * - Links to destinations: they are the rows, in `AppSidebar`.
 * - A wrapper, padding, background or border: the menu draws them.
 */
export const AppSidebarHeader = () => null;
