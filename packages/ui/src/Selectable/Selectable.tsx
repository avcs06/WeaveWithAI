'use client';

import { FROZEN_EMPTY_ARRAY } from '@packages/utils/constants';
import { useControlledValue } from '@packages/utils/hooks';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import React, { forwardRef, type ReactElement } from 'react';

import { SelectableGroupProvider, useSelectableGroup } from './context';

export type SelectableVariant = 'outline' | 'filled';

const modeVariants = { single: 'outline', multiple: 'filled' } as const;

export const useSelectableVariant = (
  variant: SelectableVariant = 'outline',
) => {
  const { mode } = useSelectableGroup();
  return mode ? modeVariants[mode] : variant;
};

// Radix toggles on click, which only buttons fire for Space.
const toggleOnSpace = (event: React.KeyboardEvent<HTMLElement>) => {
  if (event.key !== ' ' || event.currentTarget instanceof HTMLButtonElement)
    return;
  event.preventDefault();
  event.currentTarget.click();
};

export const useSelectedValues = (
  value: string[] | undefined,
  defaultValue: string[] = FROZEN_EMPTY_ARRAY<string>(),
  onChange?: (value: string[]) => void,
) => {
  const [values, setValues] = useControlledValue(value, defaultValue, onChange);

  const toggle = (item: string) =>
    setValues(
      values.includes(item)
        ? values.filter((selected) => selected !== item)
        : [...values, item],
    );

  return [values, toggle] as const;
};

export type SelectableProps = {
  value?: string;
  active?: boolean;
  defaultActive?: boolean;
  onActiveChange?: (active: boolean) => void;
  disabled?: boolean;
  children: ReactElement;
};

export const Selectable = ({
  value = '',
  active,
  defaultActive,
  onActiveChange,
  disabled,
  children,
}: SelectableProps) => {
  const { mode, values = [], onToggle } = useSelectableGroup();

  const [isActive = false, setIsActive] = useControlledValue(
    active,
    defaultActive,
    onActiveChange,
  );

  const toggles =
    active !== undefined ||
    defaultActive !== undefined ||
    onActiveChange !== undefined;

  if (mode === 'single') {
    return (
      <RadioGroupPrimitive.Item
        asChild
        value={value}
        disabled={disabled}
        onKeyDown={toggleOnSpace}
      >
        {children}
      </RadioGroupPrimitive.Item>
    );
  }

  if (mode === 'multiple') {
    return (
      <CheckboxPrimitive.Root
        asChild
        disabled={disabled}
        tabIndex={0}
        checked={values.includes(value)}
        onCheckedChange={() => onToggle?.(value)}
        onKeyDown={toggleOnSpace}
      >
        {children}
      </CheckboxPrimitive.Root>
    );
  }

  if (!toggles) return children;

  return (
    <CheckboxPrimitive.Root
      asChild
      disabled={disabled}
      tabIndex={0}
      checked={isActive}
      onCheckedChange={(checked) => setIsActive(checked === true)}
      onKeyDown={toggleOnSpace}
    >
      {children}
    </CheckboxPrimitive.Root>
  );
};

type SelectableGroupRootProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange' | 'dir'
> & {
  disabled?: boolean;
};

export type SelectableGroupProps = SelectableGroupRootProps &
  (
    | {
        mode?: 'single';
        value?: string;
        defaultValue?: string;
        onChange?: (value: string) => void;
      }
    | {
        mode: 'multiple';
        value?: string[];
        defaultValue?: string[];
        onChange?: (value: string[]) => void;
      }
  );

const SingleGroup = forwardRef<
  HTMLDivElement,
  Extract<SelectableGroupProps, { mode?: 'single' }>
>(
  (
    { mode: _mode, value: _value, defaultValue, onChange, disabled, ...props },
    ref,
  ) => {
    const [value, setValue] = useControlledValue(
      _value,
      defaultValue,
      onChange,
    );

    return (
      <SelectableGroupProvider mode="single" disabled={disabled}>
        <RadioGroupPrimitive.Root
          ref={ref}
          value={value}
          onValueChange={setValue}
          disabled={disabled}
          {...props}
        />
      </SelectableGroupProvider>
    );
  },
);

const MultipleGroup = forwardRef<
  HTMLDivElement,
  Extract<SelectableGroupProps, { mode: 'multiple' }>
>(
  (
    { mode, value: _value, defaultValue, onChange, disabled, ...props },
    ref,
  ) => {
    const [values, onToggle] = useSelectedValues(
      _value,
      defaultValue,
      onChange,
    );

    return (
      <SelectableGroupProvider
        mode={mode}
        values={values}
        disabled={disabled}
        onToggle={onToggle}
      >
        <div ref={ref} role="group" {...props} />
      </SelectableGroupProvider>
    );
  },
);

export const SelectableGroup = forwardRef<HTMLDivElement, SelectableGroupProps>(
  (props, ref) =>
    props.mode === 'multiple' ? (
      <MultipleGroup ref={ref} {...props} />
    ) : (
      <SingleGroup ref={ref} {...props} />
    ),
);
SelectableGroup.displayName = 'SelectableGroup';
