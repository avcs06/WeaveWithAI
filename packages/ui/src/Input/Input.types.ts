import type { Constant } from '@packages/utils/types';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- FormControl's own props, for the controls built on it.
import type { FormControlOwnProps } from '../FormControl/FormControl.types';
import type { SetByComponent } from '../utils';
import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ReactElement,
} from 'react';

// The field is controlled, so `defaultValue` would be ignored, and an input
// has no children.
type NativeInputProps<Excluded extends string = never> = Omit<
  ComponentPropsWithoutRef<'input'>,
  | keyof FormControlOwnProps
  | 'value'
  | 'onChange'
  | 'autoComplete'
  | 'defaultValue'
  | 'children'
  | Excluded
>;

type TextFieldProps<Excluded extends string = never> = FormControlOwnProps &
  NativeInputProps<Excluded> & {
    value: string;
    onChange: (value: string) => void;
  };

// A placeholder or a tooltip is no substitute for a name.
type FieldName =
  | { label: string }
  | { 'aria-label': string }
  | { 'aria-labelledby': string };

type DelayProps<D extends number> = {
  /**
   * What the field holds, so autofill fills it and assistive tech knows its
   * purpose: `email`, `name`, `new-password`… `off` for a field that isn't
   * about the user, like an event's title.
   */
  autoComplete: string;
  /**
   * `onChange` waits for this many ms without typing; the text shows at once.
   * Blur, Enter and unmounting send a waiting edit at once.
   */
  delay?: Constant<number, D>;
};

/** A bare `<input>`: controlled text, with an optional `delay`. */
export type BareInputProps<D extends number = never> = Omit<
  ComponentPropsWithRef<'input'>,
  'value' | 'onChange' | 'defaultValue' | 'children'
> & {
  value: string;
  onChange: (value: string) => void;
  /**
   * `onChange` waits for this many ms without typing; the text shows at once.
   * Blur, Enter and unmounting send a waiting edit at once.
   */
  delay?: Constant<number, D>;
};

/** The field the Input components render; their own types check its props. */
export type InputBaseProps<D extends number = never> = TextFieldProps &
  DelayProps<D>;

export type InputProps<D extends number = never> = TextFieldProps<'type'> &
  FieldName &
  DelayProps<D> & {
    /**
     * `email`, `tel` and `url` bring their keyboards on phones. A number
     * takes NumberInput, a password PasswordInput, a search SearchInput.
     */
    type?: 'text' | 'email' | 'tel' | 'url';
  };

/** The clear button takes the right side. */
export type SearchInputProps = TextFieldProps<'type'> &
  FieldName &
  SetByComponent<'rightIcon' | 'rightAddOn'>;

/** The toggle takes the right side and switches `type`. */
export type PasswordInputProps = InputProps &
  SetByComponent<'type' | 'rightIcon' | 'rightAddOn'>;

export type NumberInputProps<D extends number = never> = FormControlOwnProps &
  NativeInputProps<'type' | 'inputMode' | 'min' | 'max' | 'step' | 'role'> &
  FieldName &
  SetByComponent<'aria-valuemin' | 'aria-valuemax' | 'aria-valuenow'> & {
    /** `null` while the field is empty. */
    value: number | null;
    onChange: (value: number | null) => void;
    autoComplete: string;
    /**
     * `onChange` waits for this many ms without edits; the number shows at
     * once. Blur, Enter and unmounting send a waiting edit at once.
     */
    delay?: Constant<number, D>;
    min?: number;
    max?: number;
    step?: number;
    allowDecimal?: boolean;
    allowNegative?: boolean;
  };

export type FieldButtonProps = {
  /** The button's name, also shown in its tooltip. */
  label: string;
  size: FormControlOwnProps['size'];
  disabled?: boolean;
  'aria-pressed'?: boolean;
  onClick: () => void;
  children: ReactElement;
};
