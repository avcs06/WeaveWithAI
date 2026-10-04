import { readdirSync } from 'node:fs';

import { act } from '@testing-library/react';
import React, { type ComponentType } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import { Providers } from './test-utils';

// Every recipe renders on the server and hydrates in the browser, as a page
// in the app does, without a mismatch or a logged error.
const recipeFiles = readdirSync(__dirname, {
  recursive: true,
  encoding: 'utf8',
})
  .filter((file) => /^[^/]+\/[^/]+\.recipe\.tsx$/.test(file))
  .sort();

// The ErrorBoundary recipe breaks once hydrated, on purpose, to show its
// fallbacks; every other recipe must not break at all.
const breaksOnPurpose = (file: string) => file.startsWith('ErrorBoundary/');

describe.each(recipeFiles)('%s', (file) => {
  let Recipe: ComponentType;

  // Importing compiles the recipe and everything it uses: not what's tested.
  beforeAll(async () => {
    ({ default: Recipe } = await import(`./${file}`));
  }, 60_000);

  it('hydrates its server-rendered HTML without errors', async () => {
    const page = (
      <Providers>
        <Recipe />
      </Providers>
    );
    const consoleError = jest.spyOn(console, 'error');
    const recoverableErrors: unknown[] = [];
    // Collected here instead of React's default, which logs them.
    const caughtErrors: unknown[] = [];

    const container = document.createElement('div');
    container.innerHTML = renderToString(page);
    document.body.appendChild(container);
    const root = await act(async () =>
      hydrateRoot(container, page, {
        onRecoverableError: (error) => recoverableErrors.push(error),
        onCaughtError: (error) => caughtErrors.push(error),
      }),
    );

    expect(recoverableErrors).toEqual([]);
    if (breaksOnPurpose(file)) expect(caughtErrors).not.toEqual([]);
    else expect(caughtErrors).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    act(() => root.unmount());
    container.remove();
    consoleError.mockRestore();
  });
});

it('finds the recipes', () => {
  expect(recipeFiles.length).toBeGreaterThan(0);
});
