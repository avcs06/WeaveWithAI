export type DeferredPromiseStatus = 'pending' | 'resolved' | 'rejected';

export type DeferredPromise<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  readonly status: DeferredPromiseStatus;
};

/** A pending promise that code outside it settles later. */
export const createDeferredPromise = <T>(): DeferredPromise<T> => {
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  let status: DeferredPromiseStatus = 'pending';

  return {
    promise,
    get status() {
      return status;
    },
    resolve: (value) => {
      if (status !== 'pending') return;
      status = 'resolved';
      resolve(value);
    },
    reject: (reason) => {
      if (status !== 'pending') return;
      status = 'rejected';
      reject(reason);
    },
  };
};
