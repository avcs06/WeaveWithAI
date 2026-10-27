import type { checkboxRecipe } from './Checkbox.recipes.css';
import type { SelectableMultipleGroupProps } from '../Selectable';
import type { DisabledState, ReadOnlyState, SetByComponent } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';

type CheckboxRecipeVariants = NonNullable<
  RecipeVariants<typeof checkboxRecipe>
>;

// A box draws no name, and a tooltip is no substitute for one.
type CheckboxName =
  | {
      /** The label, to the right of the box. */
      children: string;
    }
  | { 'aria-label': string; children?: never }
  | { 'aria-labelledby': string; children?: never };

export type CheckedState = boolean | 'indeterminate';

type CheckboxOwnProps = CheckboxRecipeVariants &
  DisabledState &
  ReadOnlyState &
  /** Set from `checked`, `required` and the disabled state. */
  SetByComponent<
    'aria-checked' | 'aria-required' | 'aria-disabled' | 'aria-readonly'
  > & {
    /** Shown in a tooltip from the info icon after the label. */
    hint?: ReactNode;
    /** Marks the label with `*`. */
    required?: boolean;
    /** Shown on hover over the box, and on focus, above any reason. */
    tooltip?: ReactNode;
    /** Outside a CheckboxGroup, what it submits under `name` in a form. */
    name?: string;
    /** The box's id; generated when left out. */
    id?: string;
    /** For the row, around the box and its label. */
    className?: string;
    /** For the row, around the box and its label. */
    style?: CSSProperties;
  };

type CheckboxStateProps =
  | {
      /**
       * Whether the box is checked: yours to hold in state, with
       * `onCheckedChange`. `'indeterminate'` for a parent whose children are
       * partly checked.
       */
      checked: CheckedState;
      /** A click on an indeterminate box checks it. */
      onCheckedChange: (checked: boolean) => void;
      /** What it submits under `name` in a form. */
      value?: string;
    }
  | {
      /** In a CheckboxGroup, the group's `value` decides it. */
      checked?: never;
      onCheckedChange?: never;
      /** What it adds to its CheckboxGroup's value. */
      value: string;
    };

export type CheckboxProps = Omit<
  ComponentPropsWithRef<'button'>,
  | keyof CheckboxOwnProps
  | keyof CheckboxStateProps
  | 'children'
  | 'type'
  | 'role'
> &
  CheckboxOwnProps &
  CheckboxStateProps &
  CheckboxName;

/** The checked boxes' values are its `value`; the caller lays them out. */
export type CheckboxGroupProps = SelectableMultipleGroupProps;
