import type { avatarRecipe } from './Avatar.recipes.css';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ComponentPropsWithoutRef } from 'react';

type AvatarRecipeVariants = NonNullable<RecipeVariants<typeof avatarRecipe>>;

export type AvatarProps = ComponentPropsWithoutRef<'span'> &
  AvatarRecipeVariants & {
    name: string;
    src?: string;
  };
