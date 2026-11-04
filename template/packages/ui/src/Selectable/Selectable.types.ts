// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- FormControl's own props, for the controls built on it.
import type { FormControlOwnProps } from '../FormControl/FormControl.types';
import type { AccessibleName, DisabledState, ReadOnlyState } from '../utils';
import type { HTMLAttributes, ReactElement, Ref } from 'react';

export type SelectableVariant = 'outline' | 'filled';

/** A standalone toggle: both, or neither. */
export type SelectableToggleProps =
  | { active: boolean; onActiveChange: (active: boolean) => void }
  | { active?: never; onActiveChange?: never };

export type SelectableProps = SelectableToggleProps & {
  value?: string;
  disabled?: boolean;
  children: ReactElement;
};

/** What the group's FormControl takes: its label, messages and state. */
type SelectableGroupFieldProps = Pick<
  FormControlOwnProps,
  | 'id'
  | 'name'
  | 'label'
  | 'hint'
  | 'labelRightSlot'
  | 'helpText'
  | 'error'
  | 'warning'
  | 'success'
  | 'required'
> &
  DisabledState &
  ReadOnlyState & {
    /** Runs once focus leaves the group. */
    onBlur?: () => void;
    /** Reaches the group's element, which takes focus from its label. */
    ref?: Ref<HTMLDivElement>;
    'aria-labelledby'?: string;
  };

type SelectableGroupElementProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange' | 'dir' | keyof SelectableGroupFieldProps
>;

type SingleValueProps = {
  value: string;
  onChange: (value: string) => void;
};

type MultipleValueProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

/** The group's own props, which reach its element. */
export type SelectableGroupOwnProps = SelectableGroupElementProps &
  (
    | (SingleValueProps & { mode?: 'single' })
    | (MultipleValueProps & { mode: 'multiple' })
  );

// A group's choices mean nothing without the question they answer.
type SelectableGroupBaseProps = SelectableGroupFieldProps &
  SelectableGroupElementProps &
  ({ label: string } | AccessibleName);

/** A group of one choice, like RadioGroup; its component sets `mode`. */
export type SelectableSingleGroupProps = SelectableGroupBaseProps &
  SingleValueProps;

/** A group of any number of choices, like CheckboxGroup; its component sets `mode`. */
export type SelectableMultipleGroupProps = SelectableGroupBaseProps &
  MultipleValueProps;

export type SelectableGroupProps =
  | (SelectableSingleGroupProps & { mode?: 'single' })
  | (SelectableMultipleGroupProps & { mode: 'multiple' });

/** The state a group gives its items, under any of their own. */
export type SelectableGroupState = {
  disabled?: boolean;
  disabledWithReason?: string;
  readOnly?: boolean;
  readOnlyWithReason?: string;
};

export type SelectableGroupContextValue = SelectableGroupState & {
  mode?: 'single' | 'multiple';
  values?: string[];
  name?: string;
  onToggle?: (value: string) => void;
};
