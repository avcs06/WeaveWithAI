'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import React, { type FocusEvent } from 'react';

import { type ControlProps, FormControl } from '../FormControl';

import { SelectableGroupProvider, useSelectableGroup } from './context';

import type {
  SelectableGroupOwnProps,
  SelectableGroupProps,
  SelectableGroupState,
  SelectableProps,
  SelectableVariant,
} from './Selectable.types';

const modeVariants = { single: 'outline', multiple: 'filled' } as const;

export const useSelectableVariant = (
  variant: SelectableVariant = 'outline',
) => {
  const { mode } = useSelectableGroup();
  return mode ? modeVariants[mode] : variant;
};

// Radix toggles on click, which only a native button fires for Space, on key
// up. A PlainButton child sees it handled and doesn't click again.
const isSpaceOnNonButton = (event: React.KeyboardEvent<HTMLElement>) =>
  event.key === ' ' && !(event.currentTarget instanceof HTMLButtonElement);

const spaceKeys = {
  // Space would scroll the page.
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
    if (isSpaceOnNonButton(event)) event.preventDefault();
  },
  onKeyUp: (event: React.KeyboardEvent<HTMLElement>) => {
    if (!isSpaceOnNonButton(event) || event.defaultPrevented) return;
    event.preventDefault();
    event.currentTarget.click();
  },
};

function assertGroupItemValue(
  value: string | undefined,
): asserts value is string {
  if (process.env.NODE_ENV === 'production') return;
  if (value !== undefined) return;
  throw new Error(
    'Selectable: each item of a group (CardGroup, ChipGroup, CheckboxGroup, RadioGroup) needs a `value`',
  );
}

export const Selectable = ({
  value,
  active,
  onActiveChange,
  disabled,
  children,
}: SelectableProps) => {
  const { mode, values = [], name, onToggle } = useSelectableGroup();

  if (mode) {
    assertGroupItemValue(value);

    return mode === 'single' ? (
      <RadioGroupPrimitive.Item
        asChild
        value={value}
        disabled={disabled}
        {...spaceKeys}
      >
        {children}
      </RadioGroupPrimitive.Item>
    ) : (
      <CheckboxPrimitive.Root
        asChild
        name={name}
        value={value}
        disabled={disabled}
        tabIndex={0}
        checked={values.includes(value)}
        onCheckedChange={() => onToggle?.(value)}
        {...spaceKeys}
      >
        {children}
      </CheckboxPrimitive.Root>
    );
  }

  if (active === undefined) return children;

  return (
    <CheckboxPrimitive.Root
      asChild
      disabled={disabled}
      tabIndex={0}
      checked={active}
      onCheckedChange={(checked) => onActiveChange?.(checked === true)}
      {...spaceKeys}
    >
      {children}
    </CheckboxPrimitive.Root>
  );
};

type GroupElementProps = Omit<ControlProps, 'isDisabled' | 'tabIndex'> & {
  onBlur: (event: FocusEvent<HTMLDivElement>) => void;
};

type GroupRootProps = {
  group: SelectableGroupOwnProps;
  element: GroupElementProps;
  state: SelectableGroupState;
};

// FormControl also merges its box state into these props; a group draws none.
const GroupRoot = ({ group, element, state }: GroupRootProps) => {
  if (group.mode === 'multiple') {
    const { mode, value, onChange, ...props } = group;
    // A plain group takes no `aria-required`, `aria-invalid` or
    // `aria-readonly`: its message is its description, its items say read-only.
    const {
      'aria-required': _required,
      'aria-invalid': _invalid,
      'aria-readonly': _readOnly,
      name,
      ...attributes
    } = element;
    // react-hook-form's value is `undefined` until the form has a default.
    const values = value ?? [];

    return (
      <SelectableGroupProvider
        mode={mode}
        values={values}
        // Each item's own checkbox submits it; a div takes no name.
        name={name}
        {...state}
        onToggle={(item) =>
          onChange(
            values.includes(item)
              ? values.filter((selected) => selected !== item)
              : [...values, item],
          )
        }
      >
        {/* Focus from its label or a failed submit reads the group's name
            and message; Tab goes to the items. */}
        <div {...props} {...attributes} role="group" tabIndex={-1} />
      </SelectableGroupProvider>
    );
  }

  const { mode: _mode, value, onChange, ...props } = group;
  return (
    <SelectableGroupProvider mode="single" {...state}>
      {/* Radix keeps the root's tab stop, which hands focus to the chosen
          item, else the first. */}
      <RadioGroupPrimitive.Root
        {...props}
        {...element}
        // react-hook-form's value is `undefined` until the form has a default.
        value={value ?? ''}
        onValueChange={onChange}
        // With a reason, items stay arrow-key reachable and each blocks its own
        // activation.
        disabled={Boolean(state.disabled)}
      />
    </SelectableGroupProvider>
  );
};

/**
 * The items' group as a form field: FormControl supplies label, help text and
 * message; `{...field}` from Controller is all it needs.
 */
export const SelectableGroup = ({
  id,
  name,
  label,
  hint,
  labelRightSlot,
  helpText,
  error,
  warning,
  success,
  required,
  disabled,
  disabledWithReason,
  readOnly,
  readOnlyWithReason,
  onBlur,
  ref,
  'aria-labelledby': ariaLabelledBy,
  ...group
}: SelectableGroupProps) => {
  const leaveGroup = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) onBlur?.();
  };

  const disabledState =
    disabledWithReason === undefined ? { disabled } : { disabledWithReason };
  const readOnlyState =
    readOnlyWithReason === undefined ? { readOnly } : { readOnlyWithReason };

  return (
    <FormControl
      id={id}
      name={name}
      label={label}
      hint={hint}
      labelRightSlot={labelRightSlot}
      helpText={helpText}
      error={error}
      warning={warning}
      success={success}
      required={required}
      {...disabledState}
      {...readOnlyState}
      ref={ref}
      aria-labelledby={ariaLabelledBy}
      withControlBox={false}
    >
      {({ isDisabled: _isDisabled, tabIndex: _tabIndex, ...controlProps }) => (
        <GroupRoot
          group={group}
          element={{ ...controlProps, onBlur: leaveGroup }}
          state={{ ...disabledState, ...readOnlyState }}
        />
      )}
    </FormControl>
  );
};

/**
 * An item's state for `useIsDisabled`: its own over its group's. A disabled or
 * read-only group passes its state and reason down; an item's own reason wins.
 */
export const useSelectableItemState = ({
  disabled,
  disabledWithReason,
  readOnly,
  readOnlyWithReason,
}: SelectableGroupState) => {
  const group = useSelectableGroup();
  const disabledReason = disabledWithReason || group.disabledWithReason;
  const readOnlyReason = readOnlyWithReason || group.readOnlyWithReason;

  return {
    ...(disabledReason
      ? { disabledWithReason: disabledReason }
      : { disabled: disabled || group.disabled }),
    ...(readOnlyReason
      ? { readOnlyWithReason: readOnlyReason }
      : { readOnly: readOnly || group.readOnly }),
  };
};
