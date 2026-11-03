import type { cardRecipe } from './Card.recipes.css';
import type {
  SelectableGroupProps,
  SelectableProps,
  SelectableToggleProps,
} from '../Selectable';
import type { DisabledState, ReadOnlyState, SetByComponent } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type {
  ComponentPropsWithRef,
  Key,
  MouseEventHandler,
  ReactNode,
  Ref,
} from 'react';

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
  /**
   * A click anywhere on the card, outside its own links and buttons, follows
   * its first link, as a Table row's click does: for a card of a record with
   * a page of its own, whose name is that link. Ctrl and Cmd open a new tab.
   * Not with `onClick` or in a CardGroup.
   */
  stretchLink?: boolean;
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

export type CardListProps<T extends { id: Key }> = {
  /** The records, one full-width card each, in this order. */
  items: readonly T[];
  /** One record's card content; CardList draws the card around it. */
  renderItem: (item: T) => ReactNode;
  /** Names the list: "Projects". Its Pagination is named after it. */
  'aria-label': string;
  /**
   * Pages of cards, with a Pagination under them: the items' name, one and
   * many, and the first page size (10 when left out). Without it, every card
   * shows.
   */
  pagination?: { itemName?: readonly [string, string]; pageSize?: number };
  /**
   * `column` (default): one full-width card per row, for records read one by
   * one. `grid`: as many cards side by side as fit at 280px or more, for
   * records the user browses, such as products with photos.
   */
  layout?: 'column' | 'grid';
  /**
   * With `layout="grid"`, a fixed column count for a fixed set, such as 2
   * for 4 reasons, so no card sits alone in the last row. Without it, as
   * many columns as fit at 280px.
   */
  columns?: 2 | 3 | 4;
  /** Each card opens its record from anywhere on it: Card's `stretchLink`. */
  stretchLink?: boolean;
  className?: string;
};
