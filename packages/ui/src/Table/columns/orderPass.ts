import { createContext } from 'react';

/** One render of the table: columns add their ids as they render. */
export type OrderPass = {
  ids: string[];
  /** Adds `id` while this pass's render is in progress; ignored after. */
  collect: (id: string) => void;
  /** Open until the store provider's layout effect commits the order. */
  isOpen: () => boolean;
  close: () => void;
  /** Renders the store provider again, so every column collects again. */
  refresh: () => void;
};

export const createOrderPass = (
  refresh: () => void,
  onCollect: (ids: string[]) => void,
): OrderPass => {
  const ids: string[] = [];
  let open = true;
  return {
    ids,
    collect: (id) => {
      if (!open || ids.includes(id)) return;
      ids.push(id);
      onCollect(ids);
    },
    isOpen: () => {
      return open;
    },
    close: () => {
      open = false;
    },
    refresh,
  };
};

/** The current pass; a new one on every table render. */
export const ColumnOrderContext = createContext<OrderPass | null>(null);
