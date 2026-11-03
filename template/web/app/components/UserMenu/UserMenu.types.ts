import type { ButtonProps } from '@packages/ui/Button';

import type { ReactNode } from 'react';

/** The signed-in user as the menu shows them. */
export type UserMenuUser = { name: string; avatarUrl?: string };

export type UserMenuProps = Pick<ButtonProps, 'variant' | 'size' | 'look'> & {
  /** The signed-in user; null when signed out, undefined while the saved session is read. */
  user: UserMenuUser | null | undefined;
  /** In a header the menu opens below its trigger; in a sidebar, to its right. */
  placement: 'header' | 'sidebar';
  onSignOut: () => void;
  /** The sign-in page, which a signed-out visitor's Sign in button opens. */
  signInHref: string;
  /** More rows between the user's name and Sign out: `Dropdown.Item`s, such as Settings. */
  children?: ReactNode;
  /** Styles the trigger, or the Sign in button when signed out; `variant`, `size` and `look` style the Sign in button. */
  className?: string;
};
