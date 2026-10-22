import type { tagRecipe } from './Tag.recipes.css';
import type { DisabledState, IconAddonProps } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type {
  ComponentPropsWithoutRef,
  MouseEventHandler,
  ReactNode,
} from 'react';

type TagRecipeVariants = NonNullable<RecipeVariants<typeof tagRecipe>>;

export type TagProps = ComponentPropsWithoutRef<'span'> &
  Pick<TagRecipeVariants, 'variant' | 'size'> &
  DisabledState &
  Pick<
    IconAddonProps,
    'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'
  > & {
    look?: string;
    closable?: boolean;
    onClose?: MouseEventHandler<HTMLButtonElement>;
    tooltip?: ReactNode;
  };
