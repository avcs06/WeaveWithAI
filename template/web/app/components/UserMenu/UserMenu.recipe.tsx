/**
 * UserMenu: the account in a header or a sidebar, from the app's session.
 * Signed in, it shows the user's avatar and name and opens a menu: the name,
 * your rows, then Sign out, which signs out. Signed out, it shows a Sign in
 * button. While the saved session is read it shows nothing, so a signed-in
 * user never sees Sign in flash.
 *
 * When not to use:
 * - Signing up: the page's own call to action, such as the landing page's.
 * - Actions on a record: a Dropdown beside the record.
 *
 * Pitfalls:
 * - The scaffold places it where the theme puts the account: keep it there,
 *   with its `placement` and `signInHref`.
 * - `placement` matches where it sits: `header` opens the menu below,
 *   `sidebar` to the right of a sidebar's footer.
 * - Children are `Dropdown.Item`s. Sign out is already there, last.
 * - Restyle it with `className`, and the Sign in button with `variant`,
 *   `size` and `look`; the menu and its rows keep their behavior.
 */
import { UserMenu } from '@app/components/UserMenu';
import { Dropdown } from '@packages/ui/Dropdown';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

// Usage: the patterns to copy.
/** In a header: the menu opens below, with a row of your own above Sign out. */
const InHeader = () => {
  const router = useRouter();
  return (
    <UserMenu placement="header" signInHref="/sign-in">
      <Dropdown.Item
        leftIcon={<Settings />}
        onSelect={() => router.push('/settings')}
      >
        Settings
      </Dropdown.Item>
    </UserMenu>
  );
};

/** In a sidebar's footer: the menu opens to the right. */
const InSidebar = () => <UserMenu placement="sidebar" signInHref="/sign-in" />;

export default function UserMenuRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <InHeader />
      <InSidebar />
    </div>
  );
}
