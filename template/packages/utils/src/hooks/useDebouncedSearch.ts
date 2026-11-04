import { SEARCH_DEBOUNCE_MS } from '../constants';

import { useBoundState } from './useBoundState';

/**
 * A search field's text: shown at once, reaches `onSearch` after a typing
 * pause, or at once when cleared. `flush` sends waiting text now, as on Enter.
 */
export const useDebouncedSearch = (
  search: string | undefined,
  onSearch: ((text: string) => void) | undefined,
) => {
  const [searchText, setText, flush] = useBoundState(
    search ?? '',
    onSearch,
    SEARCH_DEBOUNCE_MS,
  );

  const setSearchText = (next: string) => {
    setText(next);
    if (!next) flush();
  };

  return [searchText, setSearchText, flush] as const;
};
