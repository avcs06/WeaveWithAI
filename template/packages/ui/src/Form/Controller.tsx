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

/**
 * Puts one form field under react-hook-form: validation goes in `rules`, and
 * `{...field}` gives the control its name, value, `onChange`, focus on a failed
 * submit, `required` mark and `error`. Every field in a `useForm` form renders
 * through it.
 *
 * @invalidAlternative import('react-hook-form'){Controller}
 */
export const Controller = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>({
  children,
  ...props
}: ControllerProps<TFieldValues, TName, TTransformedValues>) => {
  const controller = useController(props);
  return children(controller);
};
