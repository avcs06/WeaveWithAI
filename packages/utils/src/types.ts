export type Callable = (...args: never[]) => unknown;
export type Awaitable<T> = T | Promise<T>;

export type Indexable = string | number | symbol;
export type UnknownRecord = Record<Indexable, unknown>;

/**
 * `N` when it's narrower than `T`, as a literal or a `const` holding one is;
 * a plain `T`, like a prop or state, is `never`.
 */
export type Constant<T, N extends T> = [T] extends [N] ? never : N;
