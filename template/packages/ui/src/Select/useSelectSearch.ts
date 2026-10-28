import { useDebouncedSearch } from '@packages/utils/hooks';

import type { SelectOptionData } from './Select.types';

type SelectSearchOptions = {
  allowSearch?: boolean;
  search?: string;
  onSearch?: (text: string) => void;
};

export function useSelectSearch<Option extends { data: SelectOptionData }>(
  { allowSearch, search, onSearch }: SelectSearchOptions,
  options: Option[],
) {
  const [searchText, setSearchText] = useDebouncedSearch(search, onSearch);

  const isClientFilter = allowSearch && !onSearch && searchText !== '';

  const filteredOptions = isClientFilter
    ? options.filter(({ data }) =>
        data.label.toLowerCase().includes(searchText.toLowerCase()),
      )
    : options;

  return {
    isSearchable: Boolean(allowSearch),
    searchText,
    setSearchText,
    filteredOptions,
  };
}
