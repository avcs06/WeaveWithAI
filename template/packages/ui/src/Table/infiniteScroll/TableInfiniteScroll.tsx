import { usePersistentCallback } from '@packages/utils/hooks';
import { useConfigSync } from '@packages/utils/state';

import type { TableInfiniteScrollProps } from '../Table.types';

/** Config component: server mode loads more rows as the body nears its end. */
export const TableInfiniteScroll = ({
  totalItems,
  onLoadMore: _onLoadMore,
}: TableInfiniteScrollProps) => {
  const onLoadMore = usePersistentCallback(_onLoadMore);

  useConfigSync('infiniteScrollConfig', { totalItems, onLoadMore });

  return null;
};
