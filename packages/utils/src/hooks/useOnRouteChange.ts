import {
  ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from 'next/navigation';
import { useRef } from 'react';

import { useOnChange } from './useOnChange';

type RouteMeta = {
  pathname: string;
  searchParams: ReadonlyURLSearchParams;
  url: string;
};

type RouteChangeCallback = (
  currentRoute: RouteMeta,
  prevRoute: RouteMeta,
) => void;

export const useOnRouteChange = (callback: RouteChangeCallback) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const url = `${pathname}?${searchParams.toString()}`;

  const prevRouteRef = useRef<RouteMeta>({ pathname, searchParams, url });

  // `url` holds both pathname and search params, and compares by value.
  useOnChange(() => {
    const nextRoute = { pathname, searchParams, url };
    callback(nextRoute, prevRouteRef.current);
    prevRouteRef.current = nextRoute;
  }, [url]);
};
