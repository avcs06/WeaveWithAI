import type { toastStatusRecipe } from './Toast.recipes.css';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ReactNode } from 'react';

type StatusRecipeVariants = NonNullable<
  RecipeVariants<typeof toastStatusRecipe>
>;

export type ToastStatus = NonNullable<StatusRecipeVariants['status']>;

export type ToastAction = {
  label: ReactNode;
  /** How to do the same without the toast, read to screen readers. */
  altText: string;
  /** Runs on press; the toast closes after. */
  onClick?: () => void;
};

export type ToastConfig = {
  /** One line: it truncates. */
  title: ReactNode;
  /** Under the title, on as many lines as it needs. */
  description?: ReactNode;
  /** Sets the icon; `info` by default. `loading` spins until updated. */
  status?: ToastStatus;
  /** In place of the status's icon, in its circle. */
  icon?: ReactNode;
  action?: ToastAction;
  /** A close button; by default only an `error` toast has one. */
  closable?: boolean;
  /**
   * How long it shows, in ms. A `loading` toast stays until updated or
   * dismissed.
   */
  duration?: number;
  /** Runs once, when it starts to close for any reason. */
  onClose?: () => void;
};

export type ToastEntry = {
  id: string;
  /** False while it plays its exit, before it leaves the store. */
  open: boolean;
  config: ToastConfig;
};
