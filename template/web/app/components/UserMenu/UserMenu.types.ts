import type { ButtonProps } from '@packages/ui/Button';

import type { ReactNode } from 'react';

export type UserMenuProps = Pick<ButtonProps, 'variant' | 'size' | 'look'> & {
  /** In a header the menu opens below its trigger; in a sidebar, to its right. */
  placement: 'header' | 'sidebar';
  /** The sign-in page, which a signed-out visitor's Sign in button opens. */
  signInHref: string;
  /** More rows between the user's name and Sign out: `Dropdown.Item`s, such as Settings. */
  children?: ReactNode;
  /** Styles the trigger, or the Sign in button when signed out; `variant`, `size` and `look` style the Sign in button. */
  className?: string;
};
