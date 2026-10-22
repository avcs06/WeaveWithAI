'use client';

import {
  useController,
  type UseControllerProps,
  type UseControllerReturn,
} from './useController';

import type { ReactElement } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';

export type ControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> = UseControllerProps<TFieldValues, TName, TTransformedValues> & {
  /** Renders the field's control: `{({ field }) => <Input {...field} />}`. */
  children: (
    controller: UseControllerReturn<TFieldValues, TName>,
  ) => ReactElement;
};

export const Controller = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  children,
  ...props
}: ControllerProps<TFieldValues, TName, TTransformedValues>) => {
  const fieldState = useController(props);
  return children(fieldState);
};
