'use client';

import { type Control, type FieldValues, useFormState } from 'react-hook-form';

/**
 * Whether the form has no errors. Errors exist only once validation has run,
 * so a pristine form can submit and show what's wrong; once an error shows,
 * submitting waits until it's fixed.
 */
export const useCanSubmitForm = <
  TFieldValues extends FieldValues,
  TTransformedValues = TFieldValues,
>(
  control: Control<TFieldValues, unknown, TTransformedValues>,
) => {
  // A count memoized on `errors` goes stale if react-hook-form changes it in
  // place, as some of its versions do.
  'use no memo';
  const { errors } = useFormState({ control });
  return Object.keys(errors).length === 0;
};
