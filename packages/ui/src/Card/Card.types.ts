import type { cardRecipe } from './Card.recipes.css';
import type { SelectableGroupProps, SelectableProps } from '../Selectable';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ComponentPropsWithoutRef } from 'react';

type CardRecipeVariants = NonNullable<RecipeVariants<typeof cardRecipe>>;

export type CardSurfaceProps = ComponentPropsWithoutRef<'div'> & {
  asChild?: boolean;
  disabled?: boolean;
  clickable?: boolean;
};

export type CardProps = CardSurfaceProps &
  Pick<CardRecipeVariants, 'variant'> & {
    /**
     * Space-separated styles, in any order: `outline` or `filled` (in a group,
     * its mode picks one), `elevated`, `ghost`.
     */
    look?: string;
  } & Pick<
    SelectableProps,
    'value' | 'active' | 'defaultActive' | 'onActiveChange'
  >;

export type CardGroupProps = SelectableGroupProps;
