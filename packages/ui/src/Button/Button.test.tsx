import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef } from 'react';
import Link from 'next/link';

import { axe, renderUI } from '../test-utils';

import { Button, IconButton } from './index';

describe('Button contract', () => {
  it('renders a named native button, defaults to type=button and forwards its ref', () => {
    const ref = createRef<HTMLButtonElement>();
    renderUI(<Button ref={ref}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(ref.current).toBe(button);
  });

  it('activates once with Enter and Space', async () => {
    const onClick = jest.fn();
    renderUI(<Button onClick={onClick}>Save</Button>);
    screen.getByRole('button', { name: 'Save' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('blocks disabled activation without a native disabled attribute and shows its reason', async () => {
    const onClick = jest.fn();
    renderUI(
      <Button disabledReason="No edit permission" onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toHaveAttribute('disabled');
    expect(button).toHaveAttribute('tabindex', '-1');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.hover(button);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'No edit permission',
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('exposes loading without disabling by default', async () => {
    const onClick = jest.fn();
    renderUI(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('blocks activation when loading is configured to disable', async () => {
    const onClick = jest.fn();
    renderUI(
      <Button loading disableWhileLoading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each(['default', 'base', 'ghost', 'danger'] as const)(
    'has accessible %s variant markup',
    async (variant) => {
      const { container } = renderUI(<Button variant={variant}>Save</Button>);
      expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
      expect(await axe(container)).toHaveNoViolations();
    },
  );

  it('gives an icon button its supplied accessible name', async () => {
    const { container } = renderUI(
      <IconButton aria-label="Settings">
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Settings' })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders as Next.js Link and forwards its anchor ref', async () => {
    const ref = createRef<HTMLAnchorElement>();
    const { container } = renderUI(
      <Button as={Link} href="/settings" ref={ref}>
        Settings
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link).toHaveAttribute('href', '/settings');
    expect(ref.current).toBe(link);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders an accessible icon link', async () => {
    const { container } = renderUI(
      <IconButton as={Link} href="/settings" aria-label="Settings">
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    );
    expect(await axe(container)).toHaveNoViolations();
  });
  it('renders as a native anchor and forwards its anchor ref', async () => {
    const ref = createRef<HTMLAnchorElement>();
    const { container } = renderUI(
      <Button as="a" href="/settings" ref={ref}>
        Settings
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Settings' });
    expect(link).toHaveAttribute('href', '/settings');
    expect(link).not.toHaveAttribute('type', 'button');
    expect(ref.current).toBe(link);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders an icon button as a native anchor', async () => {
    const { container } = renderUI(
      <IconButton as="a" href="/settings" aria-label="Settings">
        <svg aria-hidden="true" />
      </IconButton>,
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Compile-time contract: as determines target props and refs. Never rendered.
function polymorphicTypeChecks() {
  const anchorRef = createRef<HTMLAnchorElement>();
  const buttonRef = createRef<HTMLButtonElement>();
  const Destination = (_props: {
    destination: string;
    children?: React.ReactNode;
  }) => null;

  <Button
    as={Link}
    href="/settings"
    prefetch={false}
    replace
    ref={anchorRef}
  />;
  <IconButton
    as={Link}
    href="/settings"
    scroll={false}
    aria-label="Settings"
  />;
  <Button as="a" href="/settings" target="_blank" download ref={anchorRef} />;
  <Button type="submit" form="settings" ref={buttonRef} />;
  <Button as={Destination} destination="settings" />;
  <IconButton as={Destination} destination="settings" aria-label="Settings" />;

  // @ts-expect-error Next.js Link requires href.
  <Button as={Link} />;
  // @ts-expect-error Custom component requires destination.
  <Button as={Destination} />;
  // @ts-expect-error Custom target does not accept href.
  <IconButton as={Destination} destination="settings" href="/settings" />;
  // @ts-expect-error Anchor target requires an anchor ref.
  <Button as="a" href="/settings" ref={buttonRef} />;
  // @ts-expect-error Default button target does not accept href.
  <Button href="/settings" />;
}
void polymorphicTypeChecks;
