'use client';

import { useMemo } from 'react';
import {
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  useController as useFieldController,
  type UseControllerProps as FieldControllerProps,
  type UseFormStateReturn,
} from 'react-hook-form';

export type UseControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = FieldControllerProps<TFieldValues, TName, TTransformedValues>;

/**
 * react-hook-form's field, named as the design system's controls name their
 * props. `disabled` is left out of the type, so `{...field}` sits beside a
 * `disabledWithReason`; a disabled form still sets it.
 */
export type ControllerField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<ControllerRenderProps<TFieldValues, TName>, 'disabled'> & {
  required: boolean;
  /** The rule's message, or `true` for a rule that has none. */
  error: string | true | undefined;
};

export type UseControllerReturn<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  field: ControllerField<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<TFieldValues>;
};

type RequiredRule = NonNullable<UseControllerProps['rules']>['required'];

// The rule that validates also marks the field required, the way
// react-hook-form reads it: an empty message enforces nothing.
const isRequired = (rule: RequiredRule) =>
  typeof rule === 'object' ? Boolean(rule.value) : Boolean(rule);

/**
 * Connects a field component of your own to react-hook-form, for a field
 * that takes `control` and `name` as props instead of sitting in a
 * `Controller`. Its `field` carries the value, `onChange`, `required` and
 * `error`: spread it on Input, Select or FormControl.
 *
 * @invalidAlternative import('react-hook-form'){useController}
 */
export const useController = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>(
  props: UseControllerProps<TFieldValues, TName, TTransformedValues>,
): UseControllerReturn<TFieldValues, TName> => {
  const { field, fieldState, formState } = useFieldController(props);
  const required = isRequired(props.rules?.required);
  // `required: true` and other rules without a message still fail the field.
  const error: ControllerField['error'] = fieldState.error
    ? fieldState.error.message || true
    : undefined;

  const controllerField = useMemo(() => {
    const { disabled, ...fieldProps } = field;
    return { ...fieldProps, ...(disabled && { disabled }), required, error };
  }, [field, required, error]);

  return { field: controllerField, fieldState, formState };
};
