import '@packages/styles/global-tailwind.css';
import '@packages/styles/global-vanilla.css';

import {
  focusRingClasses,
  type FocusRing,
} from '@packages/styles/focusRing.css';
import { themeClasses } from '@packages/styles/themes.css';
import { tokens } from '@packages/styles/tokens.css';
import React from 'react';

import { ErrorBoundary } from '../src/ErrorBoundary';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Root's barrel loads next/font; Storybook needs only the providers.
import { UIProviders } from '../src/Root/UIProviders';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the barrel exports the toast API, not the queue.
import { ToastQueue } from '../src/Toast/ToastQueue';

import type { Decorator, Preview } from '@storybook/react-vite';

// Mirrors UIRoot, which renders <html> and can't be used here. The focus ring
// class is Storybook-only, to compare rings; apps take the one in tokens.ts.
const withUIRoot: Decorator = (Story, context) => {
  const mode = context.globals['theme'] === 'dark' ? 'dark' : 'light';
  const ring = context.globals['focusRing'] as FocusRing;
  const root = document.documentElement;
  root.classList.remove(themeClasses.light, themeClasses.dark);
  root.classList.add(themeClasses[mode]);
  root.classList.remove(...Object.values(focusRingClasses));
  root.classList.add(focusRingClasses[ring]);
  root.style.colorScheme = mode;

  return (
    <UIProviders>
      <ErrorBoundary>
        <Story />
      </ErrorBoundary>
      <ToastQueue />
    </UIProviders>
  );
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color mode',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
    focusRing: {
      description: 'Focus ring style',
      toolbar: {
        title: 'Focus ring',
        icon: 'circlehollow',
        items: Object.keys(focusRingClasses).map((ring) => ({
          value: ring,
          title: `Focus ring: ${ring}`,
        })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', focusRing: tokens.focusRing },
  decorators: [withUIRoot],
};

export default preview;
