import type { cardRecipe } from './Card.recipes.css';
import type {
  SelectableGroupProps,
  SelectableProps,
  SelectableToggleProps,
} from '../Selectable';
import type { DisabledState, ReadOnlyState, SetByComponent } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ComponentPropsWithRef, MouseEventHandler, Ref } from 'react';

type CardRecipeVariants = NonNullable<RecipeVariants<typeof cardRecipe>>;

export type CardSurfaceProps = Omit<ComponentPropsWithRef<'div'>, 'ref'> & {
  asChild?: boolean;
  ref?: Ref<HTMLElement>;
  /** Left out, the props pass through untouched. */
  disabled?: boolean;
  /** Why it is disabled, shown as a tooltip. */
  reason?: string;
  /** Radix's button props, meaningless on a card. */
  type?: string;
  value?: string;
};

type CardOwnProps = Pick<CardRecipeVariants, 'variant'> & {
  /**
   * Space-separated styles, any order: `outline` or `filled` (a group's mode
   * picks one), `elevated`, `ghost`.
   */
  look?: string;
} & DisabledState &
  ReadOnlyState &
  Pick<SelectableProps, 'value'> &
  SelectableToggleProps &
  // Set from the card's mode, states and `onClick`.
  SetByComponent<'role' | 'aria-checked' | 'aria-disabled' | 'tabIndex'>;

export type CardProps = Omit<
  ComponentPropsWithRef<'div'>,
  keyof CardOwnProps | 'onClick' | 'ref'
> &
  CardOwnProps &
  (
    | {
        asChild?: false;
        ref?: Ref<HTMLDivElement>;
        /**
         * Makes the whole card a button; not with `asChild`, which would make
         * the child one too.
         */
        onClick?: MouseEventHandler<HTMLElement>;
      }
    | {
        /** Render the child element as the card, such as an `li` of a list. */
        asChild: true;
        ref?: Ref<HTMLElement>;
        onClick?: never;
      }
  );

export type CardGroupProps = SelectableGroupProps;
