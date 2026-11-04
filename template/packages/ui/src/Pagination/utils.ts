export const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50, 100];

export const getPageCount = (itemCount: number, pageSize: number) =>
  Math.max(1, Math.ceil(itemCount / pageSize));

export const getPageIndex = (pageIndex: number, pageCount: number) =>
  Math.min(pageIndex, pageCount - 1);

/** Up to `size` page indexes around the current one, shifted to stay in range. */
export const getPageWindow = (
  pageIndex: number,
  pageCount: number,
  size = 5,
) => {
  const start = Math.max(
    0,
    Math.min(pageIndex - Math.floor(size / 2), pageCount - size),
  );
  return Array.from(
    { length: Math.min(size, pageCount) },
    (_, offset) => start + offset,
  );
};
