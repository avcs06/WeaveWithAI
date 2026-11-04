import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { CheckIcon } from './CheckIcon';
import { LoadingIcon } from './LoadingIcon';
import { MinusIcon } from './MinusIcon';

describe('Icons', () => {
  it('LoadingIcon can be labelled', async () => {
    const { container } = renderUI(
      <LoadingIcon role="img" aria-label="Loading" />,
    );
    expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('CheckIcon and MinusIcon draw with a heavier stroke and can be labelled', async () => {
    const { container } = renderUI(
      <>
        <CheckIcon role="img" aria-label="Checked" />
        <MinusIcon role="img" aria-label="Partly checked" />
      </>,
    );
    for (const name of ['Checked', 'Partly checked'])
      expect(screen.getByRole('img', { name })).toHaveAttribute(
        'stroke-width',
        '3',
      );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('are hidden from assistive tech by default, beside text that says it', async () => {
    const { container } = renderUI(
      <>
        <span>
          <CheckIcon />
          Saved
        </span>
        <span>
          <MinusIcon />
          Recordings not included
        </span>
        <LoadingIcon />
      </>,
    );
    expect(screen.queryAllByRole('img')).toEqual([]);
    const [check, minus] = Array.from(container.querySelectorAll('svg'));
    expect(check).toHaveAttribute('aria-hidden', 'true');
    expect(minus).toHaveAttribute('aria-hidden', 'true');
    expect(container).toHaveTextContent('Saved');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('LoadingIcon takes role="img" from its name: an aria-label alone names it', async () => {
    // The recipe's standalone spinner, in a status that announces it.
    const { container } = renderUI(
      <div role="status">
        <LoadingIcon aria-label="Loading attendees" />
      </div>,
    );
    expect(
      screen.getByRole('img', { name: 'Loading attendees' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toContainElement(
      screen.getByRole('img', { name: 'Loading attendees' }),
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('LoadingIcon is named by aria-labelledby too', async () => {
    const { container } = renderUI(
      <>
        <span id="saving-label">Saving changes</span>
        <LoadingIcon aria-labelledby="saving-label" />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Saving changes' })).toHaveAttribute(
      'aria-labelledby',
      'saving-label',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('CheckIcon and MinusIcon need role="img" as well: a name alone stays hidden', () => {
    renderUI(
      <>
        <CheckIcon aria-label="Included" />
        <MinusIcon aria-label="Not included" />
      </>,
    );
    expect(screen.queryByRole('img', { name: 'Included' })).toBeNull();
    expect(screen.queryByRole('img', { name: 'Not included' })).toBeNull();
  });

  it('a meaning-carrying glyph is named with role="img" and aria-labelledby', async () => {
    const { container } = renderUI(
      <>
        <span id="workshop-access">Included</span>
        <CheckIcon role="img" aria-labelledby="workshop-access" />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Included' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('stays silent beside its text in a status, which does the announcing', async () => {
    const { container } = renderUI(
      <div role="status">
        <LoadingIcon />
        <span>Saving…</span>
      </div>,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saving…');
    expect(screen.queryByRole('img')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('spins, keeping the sizing class it is given', () => {
    const { container } = renderUI(
      <LoadingIcon className="icon-size-body" aria-label="Loading" />,
    );
    const spinner = screen.getByRole('img', { name: 'Loading' });
    expect(spinner).toHaveClass('animate-spin');
    expect(spinner).toHaveClass('icon-size-body');
    expect(container.querySelector('svg')).toBe(spinner);
  });

  it('lets a caller override the heavier stroke and takes a sizing class', () => {
    renderUI(
      <>
        <CheckIcon
          role="img"
          aria-label="Thin check"
          strokeWidth={2}
          className="icon-size-body"
        />
        <MinusIcon role="img" aria-label="Partly" className="icon-size-body" />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Thin check' })).toHaveAttribute(
      'stroke-width',
      '2',
    );
    for (const name of ['Thin check', 'Partly'])
      expect(screen.getByRole('img', { name })).toHaveClass('icon-size-body');
  });

  it('are not tab stops: Tab goes to the control beside them', async () => {
    const user = userEvent.setup();
    const { container } = renderUI(
      <>
        <CheckIcon role="img" aria-label="Included" />
        <LoadingIcon aria-label="Loading" />
        <MinusIcon />
        <button type="button">Save</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    for (const icon of Array.from(container.querySelectorAll('svg')))
      expect(icon).not.toHaveFocus();
    await user.tab();
    // Nothing else to reach: the icons never take focus.
    expect(screen.getByRole('button', { name: 'Save' })).not.toHaveFocus();
    for (const icon of Array.from(container.querySelectorAll('svg')))
      expect(icon).not.toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });
});
