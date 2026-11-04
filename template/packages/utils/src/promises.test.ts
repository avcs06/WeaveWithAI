import { createDeferredPromise } from './promises';

describe('createDeferredPromise', () => {
  it('starts pending', () => {
    expect(createDeferredPromise().status).toBe('pending');
  });

  it('resolves with the value', async () => {
    const deferred = createDeferredPromise<number>();
    deferred.resolve(42);
    expect(deferred.status).toBe('resolved');
    await expect(deferred.promise).resolves.toBe(42);
  });

  it('rejects with the reason', async () => {
    const deferred = createDeferredPromise<number>();
    const reason = new Error('cancelled');
    deferred.reject(reason);
    expect(deferred.status).toBe('rejected');
    await expect(deferred.promise).rejects.toBe(reason);
  });

  it('only the first call counts', async () => {
    const deferred = createDeferredPromise<number>();
    deferred.resolve(1);
    deferred.resolve(2);
    deferred.reject(new Error('late'));
    expect(deferred.status).toBe('resolved');
    await expect(deferred.promise).resolves.toBe(1);
  });

  it('reports the status before then handlers run', async () => {
    const deferred = createDeferredPromise<void>();
    const seen: string[] = [];
    const settled = deferred.promise.then(() => seen.push(deferred.status));
    deferred.resolve();
    seen.push(deferred.status);
    await settled;
    expect(seen).toEqual(['resolved', 'resolved']);
  });
});
