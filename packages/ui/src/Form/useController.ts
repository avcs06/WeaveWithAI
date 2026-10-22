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

/** react-hook-form's field, named as the design system's controls name their props. */
export type ControllerField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ControllerRenderProps<TFieldValues, TName> & {
  required: boolean;
  error: string | undefined;
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

export const useController = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>(
  props: UseControllerProps<TFieldValues, TName, TTransformedValues>,
): UseControllerReturn<TFieldValues, TName> => {
  const { field, fieldState, formState } = useFieldController(props);
  const required = isRequired(props.rules?.required);
  const error = fieldState.error?.message;

  const controllerField = useMemo(
    () => ({ ...field, required, error }),
    [field, required, error],
  );

  return { field: controllerField, fieldState, formState };
};
