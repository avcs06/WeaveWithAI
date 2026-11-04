export const SEARCH_DEBOUNCE_MS = 300;
export const INPUT_CHANGE_DEBOUNCE_MS = 300;

const _FROZEN_EMPTY_ARRAY = Object.freeze([]) as readonly never[];
export const FROZEN_EMPTY_ARRAY = <T>() =>
  _FROZEN_EMPTY_ARRAY as unknown as T[];

const _FROZEN_EMPTY_OBJECT = Object.freeze({}) as Readonly<
  Record<string, never>
>;
export const FROZEN_EMPTY_OBJECT = <T extends object>() =>
  _FROZEN_EMPTY_OBJECT as unknown as T;
