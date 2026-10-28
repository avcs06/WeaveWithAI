'use client';

import { type Control, type FieldValues, useFormState } from 'react-hook-form';

/**
 * Whether the form's submit button can be pressed: `false` while any error
 * shows. Errors exist only after validation, so a pristine form can submit and
 * show what's wrong; once an error shows, submitting waits until it's fixed.
 * Gate the button with `disabledWithReason`. An error set on `root`, like a
 * server's, counts until `clearErrors('root')`.
 */
export const useCanSubmitForm = <
  TFieldValues extends FieldValues,
  TTransformedValues = TFieldValues,
>(
  control: Control<TFieldValues, unknown, TTransformedValues>,
) => {
  // A count memoized on `errors` goes stale if react-hook-form mutates it in
  // place.
  'use no memo';
  const { errors } = useFormState({ control });
  return Object.keys(errors).length === 0;
};
