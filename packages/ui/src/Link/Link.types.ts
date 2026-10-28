import type { linkRecipe } from './Link.recipes.css';
import type { DisabledState, SetByComponent } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type LinkRecipeVariants = Pick<
  NonNullable<RecipeVariants<typeof linkRecipe>>,
  'variant'
> & {
  /**
   * Space-separated styles: `plain` drops the dotted line, for a link its place
   * already marks, like a site name in a header.
   */
  look?: string;
};

export type ChildProps = { className?: string; children?: ReactNode };

/** Set from `disabled` and `disabledWithReason`. */
type LinkStateAria = SetByComponent<'aria-disabled'>;

// An anchor without `href` isn't a link and can't be reached by keyboard.
type LinkTarget =
  | { href: string; asChild?: false }
  | {
      /** Styles its only child, a link component that takes the `href`. */
      asChild: true;
      href?: never;
    };

/** Link's look and state, for a link built on it, like the app's NextLink. */
export type LinkOwnProps = LinkRecipeVariants & DisabledState & LinkStateAria;

export type LinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> &
  LinkOwnProps &
  LinkTarget;
