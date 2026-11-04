/**
 * The bottom of the app's sidebar. It stays fixed below the rows.
 *
 * Put here:
 * - The account. Code places `UserMenu` here, in its own row, when the
 *   theme puts the account in the sidebar. It opens to the right. Keep it
 *   as it is.
 * - A secondary action that a flow has. Use a `Button` from
 *   `@packages/ui/Button`. Example: "Invite teammates".
 *
 * Wrap each piece in its own `SidebarMenuItem` from
 * `@packages/ui/SidebarMenu`, with `as="div"`. This lines it up with the
 * rows.
 *
 * Example:
 *   <SidebarMenuItem as="div">
 *     <Button>Invite teammates</Button>
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
export const AppSidebarFooter = () => null;
