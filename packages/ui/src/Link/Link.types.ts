import type { linkRecipe } from './Link.recipes.css';
import type { DisabledState } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { LinkProps as NextJsLinkProps } from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type LinkRecipeVariants = NonNullable<RecipeVariants<typeof linkRecipe>>;

export type ChildProps = { className?: string; children?: ReactNode };

export type LinkProps = ComponentPropsWithoutRef<'a'> &
  LinkRecipeVariants &
  DisabledState & {
    /** Styles its only child, a link component like Next.js's `Link`. */
    asChild?: boolean;
  };

export type NextLinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> &
  LinkRecipeVariants &
  DisabledState &
  Pick<NextJsLinkProps, 'href' | 'replace' | 'scroll' | 'prefetch'>;
