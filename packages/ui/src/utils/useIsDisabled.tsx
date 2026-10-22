// Each state is set either silently or with a reason shown to the user, never
// both.
export type DisabledState =
  | { disabled?: boolean; disabledWithReason?: never }
  | { disabled?: never; disabledWithReason?: string };

export type ReadOnlyState =
  | { readOnly?: boolean; readOnlyWithReason?: never }
  | { readOnly?: never; readOnlyWithReason?: string };

export type LoadingState =
  | { loading?: boolean; loadingWithReason?: never }
  | { loading?: never; loadingWithReason?: string };

export type DisabledProps = DisabledState &
  ReadOnlyState &
  LoadingState & {
    disableWhileLoading?: boolean;
  };

// Components pass on props already checked as `DisabledProps`.
type DisabledInput = {
  [Key in keyof DisabledProps]?: DisabledProps[Key];
};

export const useIsDisabled = ({
  disabled,
  disabledWithReason,
  readOnly,
  readOnlyWithReason,
  loading,
  loadingWithReason,
  disableWhileLoading = true,
}: DisabledInput) => {
  const isLoading = Boolean(loading || loadingWithReason);
  const isReadOnly = Boolean(readOnly || readOnlyWithReason);
  const isDisabled = Boolean(disabled || disabledWithReason);

  const shouldDisable = Boolean(
    isDisabled || isReadOnly || (isLoading && disableWhileLoading),
  );

  const stateTooltip =
    [
      isDisabled && disabledWithReason,
      isReadOnly && readOnlyWithReason,
      isLoading && loadingWithReason,
    ].find(Boolean) || '';

  return {
    isLoading,
    isDisabled: shouldDisable,
    stateTooltip,
  };
};
