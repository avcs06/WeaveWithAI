import type { chipRecipe } from './Chip.recipes.css';
import type { ButtonProps } from '../Button';
import type { SelectableGroupProps, SelectableProps } from '../Selectable';
import type { DisabledProps } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ComponentPropsWithoutRef } from 'react';

type ChipRecipeVariants = NonNullable<RecipeVariants<typeof chipRecipe>>;

type ChipOwnProps = Pick<ChipRecipeVariants, 'variant' | 'size'> & {
  /**
   * Space-separated styles, in any order: `outline` or `filled` (in a group,
   * its mode picks one), `ghost`, `rounded`.
   */
  look?: string;
} & DisabledProps &
  Pick<
    ButtonProps,
    'tooltip' | 'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'
  > &
  Pick<
    SelectableProps,
    'value' | 'active' | 'defaultActive' | 'onActiveChange'
  >;

export type ChipProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  keyof ChipOwnProps
> &
  ChipOwnProps;

export type ChipGroupProps = SelectableGroupProps;
