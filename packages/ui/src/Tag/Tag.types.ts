import type { tagRecipe } from './Tag.recipes.css';
import type { DisabledState, IconAddonProps } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type {
  ComponentPropsWithoutRef,
  MouseEventHandler,
  ReactNode,
  Ref,
} from 'react';

type TagRecipeVariants = NonNullable<RecipeVariants<typeof tagRecipe>>;

// A tag is never pressed itself: a clickable one is a Chip.
export type TagProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'onClick' | 'role' | 'tabIndex'
> &
  Pick<TagRecipeVariants, 'variant' | 'size'> &
  DisabledState &
  Pick<
    IconAddonProps,
    'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'
  > & {
    /** Space-separated styles: `!bordered` drops the border. */
    look?: string;
    /** Adds a close button, read as "Remove" and the label. */
    closable?: boolean;
    onClose?: MouseEventHandler<HTMLButtonElement>;
    /**
     * The close button. Removing the tag removes the focused button with it,
     * so the caller moves focus on: to the next tag's close button.
     */
    closeRef?: Ref<HTMLButtonElement>;
    /** `-1` inside a widget that moves focus between its tags itself. */
    closeTabIndex?: number;
    /**
     * On a closable tag, its close button shows it on hover and focus, with
     * the disabled reason, and screen readers read both. A tag that can't
     * close can't take focus: only hovering shows them, so never put
     * anything the user must know there.
     */
    tooltip?: ReactNode;
  };
