/**
 * UserMenu: the account in a header or a sidebar. Signed in, it shows the
 * user's avatar and name and opens a menu: the name, your rows, then Sign
 * out. Signed out, it shows a Sign in button. While the saved session is
 * read it shows nothing, so a signed-in user never sees Sign in flash.
 *
 * When not to use:
 * - Signing up: the page's own call to action, such as the landing page's.
 * - Actions on a record: a Dropdown beside the record.
 *
 * Pitfalls:
 * - `user` is the session as the app reads it: undefined while reading, null
 *   when signed out. Pass it as it is; don't turn undefined into null.
 * - `placement` matches where it sits: `header` opens the menu below,
 *   `sidebar` to the right of a sidebar's footer.
 * - Children are `Dropdown.Item`s. Sign out is already there, last.
 * - Restyle it with `className`, and the Sign in button with `variant`,
 *   `size` and `look`; the menu and its rows keep their behavior.
 */
import { UserMenu, type UserMenuUser } from '@app/components/UserMenu';
import { Dropdown } from '@packages/ui/Dropdown';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

// Setup: a stand-in for your app's session, not part of the pattern.
const useSession = (signedIn: boolean) => {
  const [user, setUser] = useState<UserMenuUser | null>(
    signedIn ? { name: 'Alex Morgan' } : null,
  );
  return { user, signOut: () => setUser(null) };
};

// Usage: the patterns to copy.
/** In a header: the menu opens below, with a row of your own above Sign out. */
const InHeader = () => {
  const router = useRouter();
  const { user, signOut } = useSession(true);
  return (
    <UserMenu
      user={user}
      placement="header"
      onSignOut={signOut}
      signInHref="/sign-in"
    >
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
const InSidebar = () => {
  const { user, signOut } = useSession(true);
  return (
    <UserMenu
      user={user}
      placement="sidebar"
      onSignOut={signOut}
      signInHref="/sign-in"
    />
  );
};

/** Signed out: a Sign in button to the sign-in page. */
const SignedOut = () => {
  const { user, signOut } = useSession(false);
  return (
    <UserMenu
      user={user}
      placement="header"
      onSignOut={signOut}
      signInHref="/sign-in"
    />
  );
};

export default function UserMenuRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <InHeader />
      <InSidebar />
      <SignedOut />
    </div>
  );
}
