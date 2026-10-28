import type { dialogRecipe, glyphRecipe } from './Dialog.recipes.css';
import type { IconAddonProps } from '../utils';
import type { DialogResult } from './result';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ReactElement, ReactNode } from 'react';

type DialogRecipeVariants = NonNullable<RecipeVariants<typeof dialogRecipe>>;
type GlyphRecipeVariants = NonNullable<RecipeVariants<typeof glyphRecipe>>;

/** Beside the title, as on any control: an icon wins over an add-on. */
type TitleIcons = Pick<
  IconAddonProps,
  'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'
>;

export type DialogProps = Pick<DialogRecipeVariants, 'size'> &
  TitleIcons & {
    /** Names the dialog, at its top. */
    title: ReactNode;
    /** Under the title, and what screen readers read after it. */
    description?: ReactNode;
    /**
     * The dialog's own action, like Invite, before the close button. Outside
     * the title: it doesn't name the dialog.
     */
    headerAction?: ReactNode;
    /** The body: it scrolls between the header and the footer. */
    children?: ReactNode;
    /** The actions, or a function given `close`, which closes the dialog. */
    footer?: ReactNode | ((close: () => void) => ReactNode);
    /** Opens the dialog on press: one element that forwards refs and events. */
    trigger?: ReactElement;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /**
     * Whether the close button, Escape and a press outside close it; `true`
     * by default. Without them, only the footer's actions do.
     */
    closable?: boolean;
    /** For the dialog, which renders outside the trigger's parent. */
    className?: string;
  };

export type ConfirmationDialogOptions = Pick<GlyphRecipeVariants, 'status'> & {
  title: ReactNode;
  /** The question's detail, under the title. */
  content?: ReactNode;
  /** The buttons: each closes the dialog with the result it sends. */
  footer: (closeDialog: (result?: DialogResult) => void) => ReactNode;
  /** Renders in a portal at the end of the body; `true` by default. */
  portalled?: boolean;
  className?: string;
};
