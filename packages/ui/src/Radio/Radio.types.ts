import type { radioRecipe } from './Radio.recipes.css';
import type { SelectableSingleGroupProps } from '../Selectable';
import type { DisabledState, SetByComponent } from '../utils';
import type { RecipeVariants } from '@vanilla-extract/recipes';
import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react';

type RadioRecipeVariants = NonNullable<RecipeVariants<typeof radioRecipe>>;

// A radio draws no name, and a tooltip is no substitute for one.
type RadioName =
  | {
      /** The label, to the right of the radio. */
      children: string;
    }
  | { 'aria-label': string; children?: never }
  | { 'aria-labelledby': string; children?: never };

type RadioOwnProps = Pick<RadioRecipeVariants, 'size' | 'variant'> &
  DisabledState &
  /** Set from its group's value and the disabled state. */
  SetByComponent<'aria-checked' | 'aria-disabled'> & {
    /** What choosing it sets its RadioGroup's value to. */
    value: string;
    /** Shown in a tooltip from the info icon after the label. */
    hint?: ReactNode;
    /** Shown on hover over the radio, and on focus, above any reason. */
    tooltip?: ReactNode;
    /** The radio's id; generated when left out. */
    id?: string;
    /** For the row, around the radio and its label. */
    className?: string;
    /** For the row, around the radio and its label. */
    style?: CSSProperties;
  };

export type RadioProps = Omit<
  ComponentPropsWithRef<'button'>,
  keyof RadioOwnProps | 'children' | 'type' | 'role'
> &
  RadioOwnProps &
  RadioName;

/** The chosen radio's value is its `value`; the caller lays the radios out. */
export type RadioGroupProps = SelectableSingleGroupProps;
