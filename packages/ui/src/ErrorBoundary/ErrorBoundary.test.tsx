import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

import { axe, renderUI } from '../test-utils';

import { ErrorBoundary } from './ErrorBoundary';

const renderError = new Error('Chart data is malformed');

const Chart = ({ broken = false }: { broken?: boolean }) => {
  if (broken) throw renderError;
  return <p>Revenue by month</p>;
};

// React logs every error a boundary catches.
const silencingReact = <T,>(render: () => T): T => {
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  try {
    return render();
  } finally {
    consoleError.mockRestore();
  }
};

// The same, held across clicks and key presses that render again.
const silencingReactAsync = async <T,>(run: () => Promise<T>): Promise<T> => {
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  try {
    return await run();
  } finally {
    consoleError.mockRestore();
  }
};

describe('ErrorBoundary', () => {
  it('renders its children while nothing throws', async () => {
    const onError = jest.fn();
    const { container } = renderUI(
      <ErrorBoundary onError={onError}>
        <Chart />
      </ErrorBoundary>,
    );
    expect(container).toHaveTextContent('Revenue by month');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(onError).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('announces "Something went wrong." in place of children that throw', async () => {
    const { container } = silencingReact(() =>
      renderUI(
        <>
          <p>Outside</p>
          <ErrorBoundary>
            <Chart broken />
          </ErrorBoundary>
        </>,
      ),
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong.');
    expect(alert).toContainElement(
      screen.getByRole('button', { name: 'Try again' }),
    );
    // The warning glyph is decoration; the alert's text says it.
    expect(alert.querySelector('[data-slot="icon"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(container).not.toHaveTextContent('Revenue by month');
    expect(container).toHaveTextContent('Outside');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps a healthy sibling boundary working when another one fails', async () => {
    const { container } = silencingReact(() =>
      renderUI(
        <>
          <ErrorBoundary>
            <Chart broken />
          </ErrorBoundary>
          <ErrorBoundary>
            <Chart />
          </ErrorBoundary>
        </>,
      ),
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(container).toHaveTextContent('Revenue by month');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the fallback instead, when given, announced as an alert', async () => {
    const { container } = silencingReact(() =>
      renderUI(
        <ErrorBoundary fallback={<p>Couldn&apos;t load the chart.</p>}>
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent("Couldn't load the chart.");
    expect(alert).not.toHaveTextContent('Something went wrong.');
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(container).not.toHaveTextContent('Revenue by month');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders nothing with fallback={null}', () => {
    const { container } = silencingReact(() =>
      renderUI(
        <ErrorBoundary fallback={null}>
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders nothing when a fallback function returns null', () => {
    const { container } = silencingReact(() =>
      renderUI(
        <ErrorBoundary fallback={() => null}>
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onError once with the thrown error and where it was thrown', () => {
    const onError = jest.fn();
    silencingReact(() =>
      renderUI(
        <ErrorBoundary onError={onError}>
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      renderError,
      expect.objectContaining({
        componentStack: expect.stringContaining('Chart'),
      }),
    );
  });

  it('catches children that throw on a later render', () => {
    const { container, rerender } = renderUI(
      <ErrorBoundary>
        <Chart />
      </ErrorBoundary>,
    );
    silencingReact(() =>
      rerender(
        <ErrorBoundary>
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong.',
    );
    expect(container).not.toHaveTextContent('Revenue by month');
  });

  it('shows the fallback for a thrown value that is not an Error', () => {
    const onError = jest.fn();
    const Throws = () => {
      // eslint-disable-next-line no-throw-literal -- the case under test.
      throw null;
    };
    silencingReact(() =>
      renderUI(
        <ErrorBoundary onError={onError}>
          <Throws />
        </ErrorBoundary>,
      ),
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(null, expect.anything());
  });

  it('stays on the fallback until it gets a new key', () => {
    const { container, rerender } = silencingReact(() =>
      renderUI(
        <ErrorBoundary key="first">
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    rerender(
      <ErrorBoundary key="first">
        <Chart />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(
      <ErrorBoundary key="second">
        <Chart />
      </ErrorBoundary>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container).toHaveTextContent('Revenue by month');
  });

  it('"Try again" renders the children again, once the cause is fixed', async () => {
    await silencingReactAsync(async () => {
      const user = userEvent.setup();
      const Recoverable = () => {
        const [broken, setBroken] = useState(true);
        return (
          <>
            <button type="button" onClick={() => setBroken(false)}>
              Fix the data
            </button>
            <ErrorBoundary>
              <Chart broken={broken} />
            </ErrorBoundary>
          </>
        );
      };
      const { container } = renderUI(<Recoverable />);
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Fixing the cause alone is not enough: it waits for the retry.
      await user.click(screen.getByRole('button', { name: 'Fix the data' }));
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(container).not.toHaveTextContent('Revenue by month');

      await user.click(screen.getByRole('button', { name: 'Try again' }));
      expect(screen.queryByRole('alert')).toBeNull();
      expect(container).toHaveTextContent('Revenue by month');
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('"Try again" while still broken stays on the fallback and reports again', async () => {
    await silencingReactAsync(async () => {
      const user = userEvent.setup();
      const onError = jest.fn();
      renderUI(
        <ErrorBoundary onError={onError}>
          <Chart broken />
        </ErrorBoundary>,
      );
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Something went wrong.',
      );
      expect(onError).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenLastCalledWith(
        renderError,
        expect.anything(),
      );
    });
  });

  it('reaches "Try again" by Tab and retries with Enter; the alert itself is no tab stop', async () => {
    const { container, rerender } = silencingReact(() =>
      renderUI(
        <ErrorBoundary>
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    const user = userEvent.setup();
    expect(screen.getByRole('alert')).toHaveAttribute('tabindex', '-1');

    await user.tab();
    const tryAgain = screen.getByRole('button', { name: 'Try again' });
    expect(tryAgain).toHaveFocus();

    rerender(
      <ErrorBoundary>
        <Chart />
      </ErrorBoundary>,
    );
    // Fixed input, still failed, and the retry keeps its focus.
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(tryAgain).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container).toHaveTextContent('Revenue by month');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('gives a fallback function the error and a reset, and only once failed', async () => {
    await silencingReactAsync(async () => {
      const user = userEvent.setup();
      const seen: unknown[] = [];
      const Refetch = ({ broken }: { broken: boolean }) => {
        const [fixed, setFixed] = useState(false);
        return (
          <ErrorBoundary
            fallback={({ error, reset }) => {
              seen.push(error);
              return (
                <>
                  <span>Couldn&apos;t load the chart.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFixed(true);
                      reset();
                    }}
                  >
                    Reload data
                  </button>
                </>
              );
            }}
          >
            <Chart broken={broken && !fixed} />
          </ErrorBoundary>
        );
      };
      const { container, rerender } = renderUI(<Refetch broken={false} />);
      expect(container).toHaveTextContent('Revenue by month');
      expect(seen).toEqual([]);

      rerender(<Refetch broken />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent("Couldn't load the chart.");
      expect(seen.length).toBeGreaterThan(0);
      expect(seen.every((error) => error === renderError)).toBe(true);
      expect(await axe(container)).toHaveNoViolations();

      // Fix the cause, then reset: the children render again.
      await user.click(screen.getByRole('button', { name: 'Reload data' }));
      expect(screen.queryByRole('alert')).toBeNull();
      expect(container).toHaveTextContent('Revenue by month');
    });
  });

  it('reset from a fallback function while still broken stays on the fallback', async () => {
    await silencingReactAsync(async () => {
      const user = userEvent.setup();
      renderUI(
        <ErrorBoundary
          fallback={({ reset }) => (
            <button type="button" onClick={reset}>
              Reload data
            </button>
          )}
        >
          <Chart broken />
        </ErrorBoundary>,
      );
      await user.click(screen.getByRole('button', { name: 'Reload data' }));
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Reload data' }),
      ).toBeInTheDocument();
    });
  });

  it('renders the children again when a resetKey changes, and not before', async () => {
    const { container, rerender } = silencingReact(() =>
      renderUI(
        <ErrorBoundary resetKeys={['Keynote']}>
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    // The same keys, in a new array, with the cause fixed: still failed.
    rerender(
      <ErrorBoundary resetKeys={['Keynote']}>
        <Chart />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // A changed key retries; still broken there, so it fails again.
    silencingReact(() =>
      rerender(
        <ErrorBoundary resetKeys={['Panel']}>
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('Revenue by month');

    rerender(
      <ErrorBoundary resetKeys={['Workshop']}>
        <Chart />
      </ErrorBoundary>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container).toHaveTextContent('Revenue by month');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('compares resetKeys by identity: equal values wait, more keys retry', () => {
    const { rerender } = silencingReact(() =>
      renderUI(
        <ErrorBoundary resetKeys={[Number.NaN]}>
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    rerender(
      <ErrorBoundary resetKeys={[Number.NaN]}>
        <Chart />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKeys={[Number.NaN, 'retry']}>
        <Chart />
      </ErrorBoundary>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Revenue by month')).toBeInTheDocument();
  });

  it('moves focus to "Try again" when the failed part held it', () => {
    const Controls = ({ broken = false }: { broken?: boolean }) => {
      if (broken) throw renderError;
      return (
        <button type="button">Refresh chart</button>
      );
    };
    const { rerender } = renderUI(
      <ErrorBoundary>
        <Controls />
      </ErrorBoundary>,
    );
    screen.getByRole('button', { name: 'Refresh chart' }).focus();

    silencingReact(() =>
      rerender(
        <ErrorBoundary>
          <Controls broken />
        </ErrorBoundary>,
      ),
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
  });

  it("moves focus to a custom fallback's first control when the failed part held it", () => {
    const Controls = ({ broken = false }: { broken?: boolean }) => {
      if (broken) throw renderError;
      return <button type="button">Refresh chart</button>;
    };
    const fallback = (
      <>
        <span>Couldn&apos;t load the chart.</span>
        <button type="button">Reload data</button>
        <button type="button">Dismiss</button>
      </>
    );
    const { rerender } = renderUI(
      <ErrorBoundary fallback={fallback}>
        <Controls />
      </ErrorBoundary>,
    );
    screen.getByRole('button', { name: 'Refresh chart' }).focus();

    silencingReact(() =>
      rerender(
        <ErrorBoundary fallback={fallback}>
          <Controls broken />
        </ErrorBoundary>,
      ),
    );
    expect(screen.getByRole('button', { name: 'Reload data' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Dismiss' })).not.toHaveFocus();
  });

  it('moves focus to the alert itself when the fallback has no control', async () => {
    const Controls = ({ broken = false }: { broken?: boolean }) => {
      if (broken) throw renderError;
      return <button type="button">Refresh chart</button>;
    };
    const fallback = <p>Couldn&apos;t load the chart.</p>;
    const { container, rerender } = renderUI(
      <ErrorBoundary fallback={fallback}>
        <Controls />
      </ErrorBoundary>,
    );
    screen.getByRole('button', { name: 'Refresh chart' }).focus();

    silencingReact(() =>
      rerender(
        <ErrorBoundary fallback={fallback}>
          <Controls broken />
        </ErrorBoundary>,
      ),
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveFocus();
    // Reachable by script for this hand-off, never by Tab.
    expect(alert).toHaveAttribute('tabindex', '-1');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('leaves focus where it was when the failed part did not hold it', () => {
    const { rerender } = renderUI(
      <>
        <button type="button">Outside the chart</button>
        <ErrorBoundary>
          <Chart />
        </ErrorBoundary>
      </>,
    );
    const outside = screen.getByRole('button', { name: 'Outside the chart' });
    outside.focus();

    silencingReact(() =>
      rerender(
        <>
          <button type="button">Outside the chart</button>
          <ErrorBoundary>
            <Chart broken />
          </ErrorBoundary>
        </>,
      ),
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(outside).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Try again' })).not.toHaveFocus();
  });

  it('does not take focus when it fails on its first render', () => {
    const { rerender } = renderUI(
      <>
        <button type="button">Outside the chart</button>
        <p>Chart goes here</p>
      </>,
    );
    const outside = screen.getByRole('button', { name: 'Outside the chart' });
    outside.focus();

    silencingReact(() =>
      rerender(
        <>
          <button type="button">Outside the chart</button>
          <ErrorBoundary>
            <Chart broken />
          </ErrorBoundary>
        </>,
      ),
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outside the chart' })).toBe(
      outside,
    );
    expect(outside).toHaveFocus();
  });
});
