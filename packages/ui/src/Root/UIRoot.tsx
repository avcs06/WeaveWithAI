import '@packages/styles/global-vanilla.css';
import '@packages/styles/global-tailwind.css';

import { fontClasses } from '@packages/styles/fonts';
import { getThemeClass } from '@packages/styles/theme';
import React from 'react';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the barrel exports the toast API, not the queue component.
import { ToastQueue } from '../Toast/ToastQueue';

import { UIProviders } from './UIProviders';

import type { UIRootProps } from './UIRoot.types';

/**
 * The app's `<html>` and `<body>`, rendered once in the root layout: global
 * styles, the light or dark theme before first paint, the tooltip provider
 * and the toast queue. The app puts its own error boundary inside it, around
 * its pages.
 *
 * @invalidAlternative html, body, TooltipProvider
 */
export const UIRoot = ({ lang = 'en', children }: UIRootProps) => {
  const lightThemeClass = getThemeClass('light');
  const darkThemeClass = getThemeClass('dark');
  // Reading storage throws where it's blocked; the system theme applies then.
  const systemThemeScript = `
(() => {
  let stored = null;
  try { stored = localStorage.getItem('theme-mode'); } catch {}
  const isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const root = document.documentElement;
  root.classList.remove(isDark ? ${JSON.stringify(lightThemeClass)} : ${JSON.stringify(darkThemeClass)});
  root.classList.add(isDark ? ${JSON.stringify(darkThemeClass)} : ${JSON.stringify(lightThemeClass)});
  root.style.colorScheme = isDark ? 'dark' : 'light';
})();
`;

  return (
    <html
      lang={lang}
      // eslint-disable-next-line tailwind-layout/restricted-classes
      className={`${fontClasses} ${lightThemeClass}`}
      data-light-class={lightThemeClass}
      data-dark-class={darkThemeClass}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: systemThemeScript }} />
      </head>
      <body>
        <UIProviders>
          {children}
          <ToastQueue />
        </UIProviders>
      </body>
    </html>
  );
};
