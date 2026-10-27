import {
  ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';

type RouteMeta = {
  pathname: string;
  searchParams: ReadonlyURLSearchParams;
  url: string;
};

type RouteChangeCallback = (
  currentRoute: RouteMeta,
  prevRoute: RouteMeta,
) => void;

/**
 * Runs `callback` after each navigation, not on mount, with the new route and
 * the one before it. It runs in a layout effect, so state it sets, like a menu
 * closing, applies before the new page paints. Only in a component that stays mounted across
 * navigations, like a layout or a header. Hash changes don't count. It reads
 * `useSearchParams`, so a statically rendered route needs a `<Suspense>`
 * around the component.
 */
export const useOnRouteChange = (callback: RouteChangeCallback) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const url = search ? `${pathname}?${search}` : pathname;

  const prevRouteRef = useRef<RouteMeta>({ pathname, searchParams, url });

  // `url` holds both pathname and search params, and compares by value.
  useLayoutEffect(() => {
    if (url === prevRouteRef.current.url) return;

    const nextRoute = { pathname, searchParams, url };
    callback(nextRoute, prevRouteRef.current);
    prevRouteRef.current = nextRoute;
  }, [url]);
};
