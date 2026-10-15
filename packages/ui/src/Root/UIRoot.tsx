import '@packages/styles/global-vanilla.css';
import '@packages/styles/global-tailwind.css';

import { fontClasses } from '@packages/styles/fonts';
import { getThemeClass } from '@packages/styles/theme';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import React from 'react';

import { ErrorBoundary } from '../ErrorBoundary';

export const UIRoot = ({ children }: { children: React.ReactNode }) => {
  const lightThemeClass = getThemeClass('light');
  const darkThemeClass = getThemeClass('dark');
  const systemThemeScript = `
(() => {
  const stored = localStorage.getItem('theme-mode');
  const isDark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  const root = document.documentElement;
  root.classList.remove(isDark ? ${JSON.stringify(lightThemeClass)} : ${JSON.stringify(darkThemeClass)});
  root.classList.add(isDark ? ${JSON.stringify(darkThemeClass)} : ${JSON.stringify(lightThemeClass)});
  root.style.colorScheme = isDark ? 'dark' : 'light';
})();
`;

  return (
    <html
      lang="en"
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
        <TooltipPrimitive.Provider delayDuration={200}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </TooltipPrimitive.Provider>
      </body>
    </html>
  );
};
