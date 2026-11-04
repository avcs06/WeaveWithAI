/**
 * The top of the app's sidebar. It stays fixed above the rows.
 *
 * Put here:
 * - The app's main action. Use a `Button` from `@packages/ui/Button`.
 *   Example: "New project".
 * - A search over the rows, when a flow searches them. Use `SearchInput`
 *   from `@packages/ui/Input`. Example: "Search projects".
 * - The logo. Code places `PageLogo` here, in its own row, when the theme
 *   puts the logo in the sidebar. Keep it as it is.
 *
 * Wrap each piece in its own `SidebarMenuItem` from
 * `@packages/ui/SidebarMenu`, with `as="div"`. This lines it up with the
 * rows.
 *
 * Example:
 *   <SidebarMenuItem as="div">
 *     <Button as={NextLink} href="/projects/new">New project</Button>
 *   </SidebarMenuItem>
 *
 * Never put here:
 * - Links to pages. They are the rows, in `AppSidebar`.
 * - A wrapper, padding, background or border. The row and the menu draw
 *   them.
 *
 * The line "The theme puts here" below names this app's items. Build those
 * and nothing else.
 */
export const AppSidebarHeader = () => null;
