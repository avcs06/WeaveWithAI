import type { Constant } from '@packages/utils/types';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- FormControl's own props, for the controls built on it.
import type { FormControlOwnProps } from '../FormControl/FormControl.types';
import type { ComponentPropsWithoutRef } from 'react';

// Lines of text with no icons or add-ons beside them.
type NoIconProps = {
  leftIcon?: never;
  rightIcon?: never;
  leftAddOn?: never;
  rightAddOn?: never;
};

// The field is controlled, so `defaultValue` would be ignored; its text is
// `value`, not children.
type NativeTextareaProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  keyof FormControlOwnProps | 'value' | 'onChange' | 'defaultValue' | 'children'
>;

// A placeholder or a tooltip is no substitute for a name.
type FieldName =
  | { label: string }
  | { 'aria-label': string }
  | { 'aria-labelledby': string };

export type TextareaProps<D extends number = never> = FormControlOwnProps &
  NoIconProps &
  NativeTextareaProps &
  FieldName & {
    value: string;
    onChange: (value: string) => void;
    /**
     * `onChange` waits for this many ms without typing; the text shows at
     * once. Blur and unmounting send a waiting edit at once.
     */
    delay?: Constant<number, D>;
    /** Lines shown before it scrolls; 3 by default. The user can drag it taller. */
    rows?: number;
  };
