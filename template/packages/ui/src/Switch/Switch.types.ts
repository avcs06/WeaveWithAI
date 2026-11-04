import type { switchRecipe } from './Switch.recipes.css';
import type { DisabledState, ReadOnlyState, SetByComponent } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';

type SwitchRecipeVariants = NonNullable<RecipeVariants<typeof switchRecipe>>;

// A track draws no name, and a tooltip is no substitute for one.
type SwitchName =
  | {
      /** The label, to the right of the track. */
      children: string;
    }
  | { 'aria-label': string; children?: never }
  | { 'aria-labelledby': string; children?: never };

type SwitchOwnProps = SwitchRecipeVariants &
  DisabledState &
  ReadOnlyState &
  /** Set from `checked` and the disabled state. */
  SetByComponent<'aria-checked' | 'aria-disabled' | 'aria-readonly'> & {
    /** Whether it's on: yours to hold in state, with `onCheckedChange`. */
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    /** Shown in a tooltip from the info icon after the label. */
    hint?: ReactNode;
    /** Shown on hover over the track, and on focus, above any reason. */
    tooltip?: ReactNode;
    /** The track's id; generated when left out. */
    id?: string;
    /** For the row, around the track and its label. */
    className?: string;
    /** For the row, around the track and its label. */
    style?: CSSProperties;
  };

export type SwitchProps = Omit<
  ComponentPropsWithRef<'button'>,
  keyof SwitchOwnProps | 'children' | 'type' | 'role' | 'name' | 'value'
> &
  SwitchOwnProps &
  SwitchName;
