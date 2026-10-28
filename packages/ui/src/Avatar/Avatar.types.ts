import type { avatarRecipe } from './Avatar.recipes.css';
import type { SetByComponent } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ComponentPropsWithoutRef } from 'react';

type AvatarRecipeVariants = NonNullable<RecipeVariants<typeof avatarRecipe>>;

export type AvatarProps = ComponentPropsWithoutRef<'span'> &
  AvatarRecipeVariants &
  /** Set from `name`. */
  SetByComponent<'aria-label'> & {
    name: string;
    src?: string;
  };
