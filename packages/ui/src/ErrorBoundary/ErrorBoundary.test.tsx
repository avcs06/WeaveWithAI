import { screen } from '@testing-library/react';
import React from 'react';

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
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Something went wrong.',
    );
    expect(container).not.toHaveTextContent('Revenue by month');
    expect(container).toHaveTextContent('Outside');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders the fallback instead, when given', async () => {
    const { container } = silencingReact(() =>
      renderUI(
        <ErrorBoundary fallback={<p>Couldn&apos;t load the chart.</p>}>
          <Chart broken />
        </ErrorBoundary>,
      ),
    );
    expect(container).toHaveTextContent("Couldn't load the chart.");
    expect(screen.queryByRole('alert')).toBeNull();
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
    const Throws = () => {
      // eslint-disable-next-line no-throw-literal -- the case under test.
      throw null;
    };
    silencingReact(() =>
      renderUI(
        <ErrorBoundary>
          <Throws />
        </ErrorBoundary>,
      ),
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
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
});
