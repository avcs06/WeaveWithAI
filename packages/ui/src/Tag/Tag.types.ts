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
     * The close button. Removing the tag removes the focused button, so move
     * focus to the next tag's close button.
     */
    closeRef?: Ref<HTMLButtonElement>;
    /** `-1` inside a widget that moves focus between its tags itself. */
    closeTabIndex?: number;
    /**
     * On a closable tag, the close button shows it with the disabled reason on
     * hover and focus, and screen readers read both. A tag that can't close
     * takes no focus, so only hover shows them: nothing essential here.
     */
    tooltip?: ReactNode;
  };
