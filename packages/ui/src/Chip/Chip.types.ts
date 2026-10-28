import type { chipRecipe } from './Chip.recipes.css';
import type { ButtonProps } from '../Button';
import type {
  SelectableGroupProps,
  SelectableProps,
  SelectableToggleProps,
} from '../Selectable';
import type { DisabledProps, SetByComponent } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ComponentProps } from 'react';

type ChipRecipeVariants = NonNullable<RecipeVariants<typeof chipRecipe>>;

type ChipOwnProps = Pick<ChipRecipeVariants, 'variant' | 'size'> & {
  /**
   * Space-separated styles, any order: `outline` or `filled` (a group's mode
   * picks one), `ghost`, `rounded`.
   */
  look?: string;
} & DisabledProps &
  Pick<
    ButtonProps,
    'tooltip' | 'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'
  > &
  Pick<SelectableProps, 'value'> &
  SelectableToggleProps &
  // Set from the chip's mode, `active` and states: a checkbox or a radio.
  SetByComponent<'role' | 'aria-checked' | 'aria-disabled' | 'aria-busy'>;

export type ChipProps = Omit<ComponentProps<'button'>, keyof ChipOwnProps> &
  ChipOwnProps;

export type ChipGroupProps = SelectableGroupProps & {
  /**
   * Space-separated styles: `collapsed` joins the chips into one bar, its
   * own row, with one border between chips and rounded outer corners only.
   */
  look?: string;
};
