import { memo } from 'react';

import { useTableStore } from '../store';

import { useScrollEnd } from './useScrollEnd';

export type InfiniteScrollTriggerProps = {
  /** Rows loaded so far. */
  data: readonly unknown[];
  loading: boolean;
};

/** Renders nothing: calls `onLoadMore` when the body nears its end. */
export const InfiniteScrollTrigger = memo(
  ({ data, loading }: InfiniteScrollTriggerProps) => {
    const config = useTableStore('infiniteScrollConfig');
    const bodyViewport = useTableStore('bodyViewport');

    const hasMore = config !== undefined && data.length < config.totalItems;
    useScrollEnd(bodyViewport, {
      enabled: hasMore && !loading,
      onEnd: () => config?.onLoadMore(),
      content: data,
    });

    return null;
  },
);
InfiniteScrollTrigger.displayName = 'InfiniteScrollTrigger';
