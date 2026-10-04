import { useContext, useLayoutEffect } from 'react';

import { useGetTableStore } from '../store';

import { ColumnOrderContext } from './orderPass';

/** Places the column: collects its id while the table renders. */
export const useColumnOrder = (id: string) => {
  const { store } = useGetTableStore();
  const pass = useContext(ColumnOrderContext);
  if (!pass) throw new Error('Table.Column must be rendered inside <Table>');
  pass.collect(id);

  useLayoutEffect(() => {
    // Rendered with the table: the store provider commits the order next.
    if (pass.isOpen()) return;
    // Mounted or renamed in a render the table wasn't part of, e.g. inside a
    // wrapper that re-rendered alone: collect the order again.
    if (!store('columnOrder').includes(id)) pass.refresh();
  }, [pass, id, store]);
};
