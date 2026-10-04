export type Callable = (...args: never[]) => unknown;
export type Awaitable<T> = T | Promise<T>;

export type Indexable = string | number | symbol;
export type UnknownRecord = Record<Indexable, unknown>;
