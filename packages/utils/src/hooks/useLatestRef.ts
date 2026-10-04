import { useRef } from 'react';

/** A ref holding the value from the latest render, assigned during render. */
export const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};
