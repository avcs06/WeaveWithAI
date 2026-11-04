import { useEffect, useState } from 'react';

// No backend yet: every operation waits NEXT_PUBLIC_MOCK_LATENCY_MS, and fails
// when localStorage 'weave:fail' names it, so loading and error states show.

const LATENCY = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 0);

function failing(operation: string): boolean {
  try {
    return localStorage.getItem('weave:fail') === operation;
  } catch {
    return false;
  }
}

export async function mockCall(operation: string): Promise<void> {
  if (LATENCY > 0) await new Promise((resolve) => setTimeout(resolve, LATENCY));
  if (failing(operation)) throw new Error(`${operation} failed`);
}

/** A read as a page renders it: the data, while it loads, its error, and a retry. */
export type Read<T> = { data: T; loading: boolean; error: Error | null; retry: () => void };

export function useRead<T>(operation: string, data: T): Read<T> {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<{ loading: boolean; error: Error | null }>({
    loading: LATENCY > 0,
    error: null,
  });
  useEffect(() => {
    let live = true;
    mockCall(operation).then(
      () => live && setStatus({ loading: false, error: null }),
      (error: Error) => live && setStatus({ loading: false, error }),
    );
    return () => {
      live = false;
    };
  }, [operation, attempt]);
  const retry = () => {
    setStatus({ loading: LATENCY > 0, error: null });
    setAttempt((n) => n + 1);
  };
  return { data, ...status, retry };
}
