import type { UnknownRecord } from '@packages/utils/types';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- FormControl's own props, for the controls built on it.
import type { FormControlOwnProps } from '../FormControl/FormControl.types';
import type { DisabledState } from '../utils';
import type { ReactNode } from 'react';

/**
 * An option as `onChange` and `renderTrigger` get it: its `value`, `label`
 * and the other props of its `SelectOption`, typed by `D`. They're optional:
 * a value no option has described comes as `{ value, label: value }`.
 */
export type SelectOptionData<
  V extends string = string,
  D extends object = UnknownRecord,
> = Partial<D> & {
  value: V;
  label: string;
};

export type SelectSearchProps =
  | {
      allowSearch?: true;
      search?: string;
      onSearch?: (text: string) => void;
    }
  | {
      allowSearch: false;
      search?: never;
      onSearch?: never;
    };

export type SelectBaseProps = FormControlOwnProps &
  SelectSearchProps & {
    /** Lets the user clear the selection, with Delete or the clear button. */
    allowClear?: boolean;
    /** A checkbox before each option, ticked when selected. */
    showCheckbox?: boolean;
    /** A check mark after each selected option; on by default. */
    showCheckmark?: boolean;
    /** Runs once focus leaves the Select: trigger, search and menu. */
    onBlur?: () => void;
    /** Names a Select without a label; the placeholder does otherwise. */
    'aria-label'?: string;
    /** For the field's root. */
    className?: string;
  };

export type SelectProps<
  V extends string = string,
  D extends object = UnknownRecord,
> = SelectBaseProps & {
  /** `''` is nothing selected. */
  value: V | '';
  onChange: (value: V | '', option: SelectOptionData<V, D> | undefined) => void;
  /** Replaces the selected label. */
  renderTrigger?: (trigger: {
    selected: SelectOptionData<V, D>;
    open: boolean;
  }) => ReactNode;
  /** `SelectOption` elements, one per option, or in `SelectGroup`s. */
  children: ReactNode;
};

export type MultiSelectProps<
  V extends string = string,
  D extends object = UnknownRecord,
> = SelectBaseProps & {
  value: readonly V[];
  /** The values in selection order, and their options in that order. */
  onChange: (values: V[], options: SelectOptionData<V, D>[]) => void;
  /** Replaces the tags. */
  renderTrigger?: (trigger: {
    selected: SelectOptionData<V, D>[];
    open: boolean;
  }) => ReactNode;
  /** `SelectOption` elements, one per option, or in `SelectGroup`s. */
  children: ReactNode;
};

export type SelectControlProps<
  V extends string = string,
  D extends object = UnknownRecord,
> = SelectBaseProps & {
  multiple: boolean;
  value: readonly V[];
  onChange: (values: V[], options: SelectOptionData<V, D>[]) => void;
  renderTrigger?: (trigger: {
    selected: SelectOptionData<V, D>[];
    open: boolean;
  }) => ReactNode;
};

export type SelectOptionProps<V extends string = string> = DisabledState & {
  value: V;
  /** What the trigger shows and search matches. */
  label: string;
  /** The row's content in the menu; the label without it. */
  children?: ReactNode;
  /** Every other prop is option data, passed to `onChange`. */
  [key: string]: unknown;
};

export type SelectGroupProps = {
  /** Shown above the group's options, and names the group. */
  label: string;
  /** The group's `SelectOption` elements. */
  children: ReactNode;
};

export type SelectOptionGroup = {
  id: string;
  label: string;
};

export type SelectOptionEntry = {
  data: SelectOptionData;
  disabledState: DisabledState;
  group: SelectOptionGroup | undefined;
};

export type SelectOptionItem = SelectOptionEntry & { id: string };
